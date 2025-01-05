import psutil
import os
import io
import shutil
import secrets
import hashlib
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

import pyminizip
import numpy as np
import torch
import cv2
from PIL import Image as pilImage
from torchvision import transforms
from torch.nn.functional import softmax
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage
from backend.settings import EMAIL_HOST_USER

from .models import Image, NetowrkException
from .serializers import UsageFilesSerializer


NETWORK = "MlModels/googleNetFinalV1.pth"

def get_memory_usage():
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_usage_mb = memory_info.rss / (1024 ** 2)
    return memory_usage_mb

def load_network():
    best_model = default_storage.path(NETWORK)
    if best_model:
        model_path = Path(best_model)
        network = torch.load(
            model_path, map_location=torch.device("cpu"), weights_only=False
        )
        if isinstance(network, torch.nn.DataParallel):
            network = network.module
        network = network.to("cpu")
        network.eval()
    else:
        raise NetowrkException("No Network")
    return network


def array_hash(pt):
    arr = cv2.imread(pt)  # pylint: disable=c-extension-no-member
    arr_bytes = arr.tobytes()

    sha256 = hashlib.sha256()

    sha256.update(arr_bytes)

    return sha256.hexdigest()


def array_hash2(pt):
    arr = cv2.imread(pt, 0)  # pylint: disable=c-extension-no-member
    arr_bytes = arr.tobytes()

    sha256 = hashlib.sha256()

    sha256.update(arr_bytes)

    return sha256.hexdigest()


def array_hash_in_memory2(im):
    arr_bytes = im.tobytes()

    sha256 = hashlib.sha256()

    sha256.update(arr_bytes)

    return sha256.hexdigest()


def check_duplicates_in_system(path):
    im_hash = array_hash(path)
    image1 = cv2.imread(path)  # pylint: disable=c-extension-no-member
    media = "/Users/miloszwojtaszczyk/Praca_inz/Aplikacja/backend/media/Images"
    for file_name in os.listdir(media):
        if im_hash == array_hash(media + "/" + file_name):
            image2 = cv2.imread(  # pylint: disable=c-extension-no-member
                media + "/" + file_name
            )
            if image1.shape == image2.shape:
                if (
                    np.count_nonzero(
                        cv2.subtract(image1, image2) # pylint: disable=c-extension-no-member
                    )
                    == 0
                ):
                    raise ValidationError("Exact image already exists: " + file_name)
    return True


def check_duplicates_in_dataset(im):
    im_hash = array_hash_in_memory2(im)
    image1 = im
    media = os.path.join(
        os.path.dirname(os.path.abspath(__file__)).split("backend")[0], "Dataset"
    )
    for folder in os.listdir(media):
        if folder == ".DS_Store":
            continue
        for file_name in os.listdir(media + "/" + folder):
            if im_hash == array_hash2(os.path.join(media, folder, file_name)):
                image2 = cv2.imread(  # pylint: disable=c-extension-no-member
                    os.path.join(media, folder, file_name), 0
                )
                if image1.shape == image2.shape:
                    if (
                        np.count_nonzero(
                            cv2.subtract(image1, image2) # pylint: disable=c-extension-no-member
                        )
                        == 0
                    ):
                        return True
    return False


def save_blank_pil_image(im_path):
    im = pilImage.open(im_path)
    image_io = io.BytesIO()
    im.save(image_io, format="PNG")
    image_io.seek(0)
    content_file = ContentFile(image_io.read(), name=im_path.split("/")[-1])
    hash_number = array_hash(im_path)
    print(len(hash_number))
    im_ob = Image(photo=content_file, hash=hash)
    im_ob.save()


def array_hash_in_memory(image_bytes):
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(  # pylint: disable=c-extension-no-member
        image_array, cv2.IMREAD_COLOR  # pylint: disable=c-extension-no-member
    )  # pylint: disable=c-extension-no-member

    arr_bytes = image.tobytes()

    sha256 = hashlib.sha256()
    sha256.update(arr_bytes)

    return sha256.hexdigest(), image


def check_if_image_has_duplicate_in_file_system_in_memory(image_bytes):
    im_hash, image1 = array_hash_in_memory(image_bytes)

    media_path = "/Users/miloszwojtaszczyk/Praca_inz/Aplikacja/backend/media/Images"

    for file_name in os.listdir(media_path):
        existing_image_path = os.path.join(media_path, file_name)

        existing_image = cv2.imread(  # pylint: disable=c-extension-no-member
            existing_image_path
        )
        existing_hash = array_hash(existing_image_path)
        if im_hash == existing_hash:
            if image1.shape == existing_image.shape:
                if (
                    np.count_nonzero(cv2.subtract(image1, existing_image)) # pylint: disable=c-extension-no-member
                    == 0
                ):
                    raise ValidationError(f"Exact image already exists: {file_name}")
    return True


def check_if_image_exists(image_bytes):
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
    resized = cv2.resize( # pylint: disable=c-extension-no-member
        img, (new_w, new_h), inter
    )
    return cv2.copyMakeBorder(  # pylint: disable=c-extension-no-member
        resized,
        top,
        bottom,
        left,
        right,
        cv2.BORDER_CONSTANT, # pylint: disable=c-extension-no-member
        value=[0, 0, 0],
    )


def crop_image(image_path):
    image = cv2.imread(image_path, 0)  # pylint: disable=c-extension-no-member
    blurred = cv2.GaussianBlur( # pylint: disable=c-extension-no-member
        image, (5, 5), 0
    )

    _, thresholded = cv2.threshold( # pylint: disable=c-extension-no-member
        blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU # pylint: disable=c-extension-no-member
    )

    contours, _ = cv2.findContours(  # pylint: disable=c-extension-no-member
        thresholded,
        cv2.RETR_EXTERNAL, # pylint: disable=c-extension-no-member
        cv2.CHAIN_APPROX_SIMPLE,  # pylint: disable=c-extension-no-member
    )

    largest_contour = max(
        contours, key=cv2.contourArea # pylint: disable=c-extension-no-member
    )  # pylint: disable=c-extension-no-member

    x, y, w, h = cv2.boundingRect( # pylint: disable=c-extension-no-member
        largest_contour
    )  # pylint: disable=c-extension-no-member
    cropped_image = image[y : y + h, x : x + w]

    return cropped_image


data_transform = transforms.Compose(
    [
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.1966, 0.1966, 0.1966], std=[0.2023, 0.2023, 0.2023]
        ),
    ]
)


def get_single_image_prediction(immage, network):
    im = crop_image(default_storage.path(immage.photo.name))
    im = resize_preserve_aspect(
        im, 224, cv2.INTER_LINEAR # pylint: disable=c-extension-no-member
    )  # pylint: disable=c-extension-no-member
    im = cv2.cvtColor(im, cv2.COLOR_GRAY2RGB)  # pylint: disable=c-extension-no-member
    im = pilImage.fromarray(im)
    input_tensor = data_transform(im).unsqueeze(0)
    with torch.no_grad():
        outputs = network(input_tensor)
        probabilities = softmax(outputs, dim=1)
        predicted_probs = probabilities.squeeze().cpu().numpy()
    return predicted_probs * 100


def generate_password():
    return secrets.token_urlsafe(8)


def delete_file(file):
    if os.path.exists(file):
        os.remove(file)


def generate_password_file(password):
    with open("password.txt", "w", encoding="utf-8") as f:
        f.write(f"Twoje hasło: {password}")
    return "password.txt"


def generate_zip_file(password_file, PESEL):
    pyminizip.compress(password_file, None, "password_in_zip.zip", PESEL, 5) # pylint: disable=c-extension-no-member
    return "password_in_zip.zip"


def send_email(email, file, username):
    email_message = EmailMessage(
        subject="Your account has been created.",
        body=(
            f"Password was encrypted by your PESEL number. Your username is '{username}'"
        ),
        from_email=EMAIL_HOST_USER,
        to=[email],
    )
    with open(file, "rb") as f:
        email_message.attach(file, f.read(), "application/zip")
    email_message.send()


def fronted_happy_reformat_history(data):
    result = []
    for item in data:
        for classification in reversed(item.get("classifications", [])):
            id_class = classification.get("id")
            image = classification.get("image", {})
            patient = image.get("patient", {})
            result.append(
                {
                    "id": f"{id_class}",
                    "patient": f"{patient.get('first_name')} {patient.get('last_name')}",
                    "image_id": (image.get("id")),
                    "date": (item.get("date_of_creation")),
                    "image_url": image.get("photo"),
                    "tumor_type": image.get("tumor_type"),
                    "no_tumor_prob": classification.get("no_tumor_prob"),
                    "pituitary_prob": classification.get("pituitary_prob"),
                    "meningioma_prob": classification.get("meningioma_prob"),
                    "glioma_prob": classification.get("glioma_prob"),
                }
            )
    return result


def add_image_t_dataset(src, old_tt, new_tt):
    tts = {0: "None", 1: "glioma", 2: "meningioma", 3: "pituitary", 4: "notumor"}
    path = default_storage.path(src)
    dataset = os.path.join(
        os.path.dirname(os.path.abspath(__file__)).split("backend")[0], "Dataset"
    )
    if old_tt is None or int(old_tt) == 0:
        im = crop_image(path)
        im = resize_preserve_aspect(
            im, 224, cv2.INTER_LINEAR # pylint: disable=c-extension-no-member
        )  # pylint: disable=c-extension-no-member
        if check_duplicates_in_dataset(im):
            return False
        cv2.imwrite( # pylint: disable=c-extension-no-member
            os.path.join(dataset, tts[int(new_tt)], src.split("/")[-1]), im
        )  # pylint: disable=c-extension-no-member
    else:
        if new_tt is None or int(new_tt) == 0:
            if os.path.exists(
                os.path.join(dataset, tts[int(old_tt)], src.split("/")[-1])
            ):
                os.remove(os.path.join(dataset, tts[int(old_tt)], src.split("/")[-1]))
        else:
            if os.path.exists(
                os.path.join(dataset, tts[int(old_tt)], src.split("/")[-1])
            ):
                shutil.move(
                    os.path.join(dataset, tts[int(old_tt)], src.split("/")[-1]),
                    os.path.join(dataset, tts[int(new_tt)], src.split("/")[-1]),
                )


def prepare_all_usages(data):
    response_data = []

    for usage in data:
        report_data = {"report": UsageFilesSerializer(usage).data, "patients": []}

        patient_classification_counts = defaultdict(int)

        for classification in usage.classifications.all():
            if classification.image and classification.image.patient:
                patient = classification.image.patient
                full_name = f"{patient.first_name} {patient.last_name}"
                patient_classification_counts[full_name] += 1

        report_data["patients"] = [
            {"patient": name, "classification_count": count}
            for name, count in patient_classification_counts.items()
        ]

        response_data.append(report_data)

    return response_data


def round_decimal(decimal):
    return Decimal(round(float(decimal), 7)).quantize(
        Decimal("0.0000001"), rounding=ROUND_HALF_UP
    )


def cleanup_saved_photos(saved_photos):
    for file_path in saved_photos:
        delete_file(file_path)
