import io
import os
from rest_framework.response import Response
from django.core.files.base import ContentFile
from .models import Image, MlModel
from pathlib import Path
from PIL import Image as pilImage
import hashlib
import cv2
import numpy as np
from django.core.exceptions import ValidationError
import torch
from torchvision import transforms
from django.core.files.storage import default_storage
from torch.nn.functional import softmax
import secrets
import pyminizip
from django.core.mail import EmailMessage
from backend.settings import EMAIL_HOST_USER
import datetime


def loadNetwork():
    try:
        best_model = MlModel.objects.order_by("-accuracy").first()
        if best_model:
            model_path = Path(best_model.pytorch_model.path)
            network = torch.load(
                model_path, map_location=torch.device("cpu"), weights_only=False
            )
            if isinstance(network, torch.nn.DataParallel):
                network = network.module
            network = network.to("cpu")
            network.eval()
        else:
            raise Exception('No Network')
    except Exception as e:
        raise e
    return network,best_model

def array_hash(pt):
    arr = cv2.imread(pt)
    arr_bytes = arr.tobytes()

    sha256 = hashlib.sha256()

    sha256.update(arr_bytes)

    return sha256.hexdigest()


def checkIfImageHasDuplicateInFileSystem(path):
    im_hash = array_hash(path)
    image1 = cv2.imread(path)
    mediaPath = "/Users/miloszwojtaszczyk/Praca_inz/Aplikacja/backend/media/Images"
    for file_name in os.listdir(mediaPath):
        if im_hash == array_hash(mediaPath + "/" + file_name):
            image2 = cv2.imread(mediaPath + "/" + file_name)
            if image1.shape == image2.shape:
                if np.count_nonzero(cv2.subtract(image1, image2)) == 0:
                    raise ValidationError("Exact image already exists: " + file_name)
    return True


def saveBlankPILimage(im_path):
    im = pilImage.open(im_path)
    image_io = io.BytesIO()
    im.save(image_io, format="PNG")
    image_io.seek(0)
    content_file = ContentFile(image_io.read(), name=im_path.split("/")[-1])
    hash = array_hash(im_path)
    print(len(hash))
    im_ob = Image(photo=content_file, hash=hash)
    im_ob.save()


def array_hash_in_memory(image_bytes):
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    arr_bytes = image.tobytes()

    sha256 = hashlib.sha256()
    sha256.update(arr_bytes)

    return sha256.hexdigest(), image


def check_if_image_has_duplicate_in_file_system_in_memory(image_bytes):
    im_hash, image1 = array_hash_in_memory(image_bytes)

    media_path = "/Users/miloszwojtaszczyk/Praca_inz/Aplikacja/backend/media/Images"

    for file_name in os.listdir(media_path):
        existing_image_path = os.path.join(media_path, file_name)

        existing_image = cv2.imread(existing_image_path)
        existing_hash = array_hash(existing_image_path)
        if im_hash == existing_hash:
            if image1.shape == existing_image.shape:
                if np.count_nonzero(cv2.subtract(image1, existing_image)) == 0:
                    raise ValidationError(f"Exact image already exists: {file_name}")
    return True


def checkIfImageExists(image_bytes):
    im_hash, _ = array_hash_in_memory(image_bytes)
    ob = Image.objects.filter(hash=im_hash).first()
    return ob, im_hash


def resize_preserve_aspect(img, target_size, inter):
    h, w = img.shape[:2]
    aspect_ratio = w / h
    delta, left, right, bottom, top = (0, 0, 0, 0, 0)
    if w > h:
        new_w = target_size
        new_h = int(target_size / aspect_ratio)
        delta = target_size - new_h
        bottom = delta // 2
        top = delta - bottom
    else:
        new_h = target_size
        new_w = int(target_size * aspect_ratio)
        delta = target_size - new_w
        left = delta // 2
        right = delta - left
    resized = cv2.resize(img, (new_w, new_h), inter)
    return cv2.copyMakeBorder(
        resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=[0, 0, 0]
    )


def crop_image(image_path):
    image = cv2.imread(image_path, 0)

    blurred = cv2.GaussianBlur(image, (5, 5), 0)

    _, thresholded = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(
        thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    largest_contour = max(contours, key=cv2.contourArea)

    x, y, w, h = cv2.boundingRect(largest_contour)
    cropped_image = image[y : y + h, x : x + w]

    return cropped_image


data_transform = transforms.Compose(
    [
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)


def getSingleImagePrediction(Im,network):
    im = crop_image(default_storage.path(Im.photo.name))
    im = resize_preserve_aspect(im, 224, cv2.INTER_LINEAR)
    im = cv2.cvtColor(im, cv2.COLOR_GRAY2RGB)
    im = pilImage.fromarray(im)
    input_tensor = data_transform(im).unsqueeze(0)
    with torch.no_grad():
        outputs = network(input_tensor)
        probabilities = softmax(outputs, dim=1)
        predicted_probs = probabilities.squeeze().cpu().numpy()
        # predicted_probs = outputs.squeeze().cpu().numpy()
    return predicted_probs *100


def generate_password():
    return secrets.token_urlsafe(8)


def generatePasswordFile(password):
    with open("password.txt", "w") as f:
        f.write(f"Twoje hasło: {password}")
    return "password.txt"

def generateZipFile(password_file,PESEL):
    pyminizip.compress(password_file, None, "password_in_zip.zip", PESEL, 5)
    return "password_in_zip.zip"

def sendEmail(email,file):
    email_message = EmailMessage(
        subject="Twoje konto zostało utworzone",
        body=(
            "Password was encrypted by your PESEL number"
        ),
        from_email=EMAIL_HOST_USER,
        to=[email],
    )
    with open(file, "rb") as f:
        email_message.attach(file, f.read(), "application/zip")
    email_message.send()
    
    
def frontedHappyReformatHistory(data):
    result = []
    for item in data:
        id_usage = item.get("id")
        for classification in item.get('classifications', []):
            id_class = classification.get('id')
            image = classification.get('image', {})
            patient = image.get('patient', {})
            result.append({
                "id": f"{id_class}",
                "patient": f"{patient.get("first_name")} {patient.get("last_name")}",
                "image_id":(image.get('id')),
                "date": (item.get("date_of_creation")),
                "image_url": image.get("photo"),
                "tumor_type": image.get("tumor_type"),
                "no_tumor_prob": classification.get("no_tumor_prob"),
                "pituitary_prob": classification.get("pituitary_prob"),
                "meningioma_prob": classification.get("meningioma_prob"),
                "glioma_prob": classification.get("glioma_prob"),
                
            })
    return result