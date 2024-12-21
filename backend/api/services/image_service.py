from django.shortcuts import get_object_or_404
from ..serializers import ImageSerializer, ImageCreateSerializer
from ..models import Image, TumorClassified, Patient
from ..utils import addImageToDataset, checkIfImageExists
from django.db import transaction


def classify_image(pk, tumor_type, user):
    image = get_object_or_404(Image, pk=pk)
    if image.tumor_type is not None:
        raise TumorClassified
    old_tt = image.tumor_type
    image.tumor_type = tumor_type
    image.classified_by = user
    with transaction.atomic():
        image.save()
        addImageToDataset(image.photo.name, old_tt, image.tumor_type)
    return image


def change_image_data(pk, user, tumor_type=None, patient_pk=None):
    image = get_object_or_404(Image, pk=pk)
    old_tt = image.tumor_type
    if tumor_type:
        if tumor_type == "0":
            setattr(image, "tumor_type", None)
        else:
            setattr(image, "tumor_type", tumor_type)
        setattr(image, "classified_by", user)
    if patient_pk:
        patient = get_object_or_404(Patient, pk=patient_pk)
        setattr(image, "patient", patient)
    with transaction.atomic():
        image.save()
        if tumor_type:
            addImageToDataset(image.photo.name, old_tt, image.tumor_type)


def get_image(data, patient):
    im_bytes = data.read()
    ob, im_hash = checkIfImageExists(im_bytes)
    if ob:
        if ob.patient.PESEL != patient.PESEL:
            raise ValueError(f"Exact imaage exists and its different patient")
        return ob
    data.seek(0)
    image_data = {
        "photo": data,
        "hash": im_hash,
        "patient": patient.id,
    }
    image = ImageCreateSerializer(data=image_data)
    if not image.is_valid():
        raise ValueError(f"{image.errors}")
    return image.create(image.validated_data)


def get_images(patients, photos):
    saved_images = []
    images = []
    photos_dict = {photo.name: photo for photo in photos}
    for patient in patients:
        for name in patient.cur_images:
            photo = photos_dict[name]
            im_bytes = photo.read()
            ob, im_hash = checkIfImageExists(im_bytes)
            if ob:
                if ob.patient.PESEL != patient.PESEL:
                    raise ValueError(
                        f"Exact imaage exists and its different patient. Image {name}, patient {patient.first_name} {patient.last_name}, exisitng patient {ob.patient.first_name} {ob.patient.last_name}"
                    )
                images.append(ob)
            else:
                photo.seek(0)
                data = {"photo": photo, "hash": im_hash, "patient":patient.id}
                image = ImageCreateSerializer(data=data)
                if not image.is_valid():
                    raise ValueError(f"{image.errors}")
                image = image.create(image.validated_data)
                saved_images.append(image.photo.path)
                images.append(image)
            photo.seek(0)
    return images, saved_images
