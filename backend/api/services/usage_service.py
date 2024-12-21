from ..utils import (
    loadNetwork,
    checkIfImageExists,
    getSingleImagePrediction,
    round_decimal,
)
import json
from ..models import Patient, Image, Usage, Report, Classification
from django.core.files.base import ContentFile
from ..serializers import PatientSerializer, ImageSerializer
from django.db import transaction
from decimal import Decimal, ROUND_HALF_UP
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from .patient_service import get_patient, get_patients_with_images
from .image_service import get_image, get_images
import pandas as pd
from io import StringIO


def evaluate_image(image, usage, network):
    glioma, menin, no_t, pituitary = getSingleImagePrediction(image, network)

    classification = Classification(
        usage=usage,
        image=image,
        no_tumor_prob=round_decimal(no_t),
        pituitary_prob=round_decimal(pituitary),
        meningioma_prob=round_decimal(menin),
        glioma_prob=round_decimal(glioma),
    )
    classification.save()
    return classification


def evaluate_images(images, usage, network):
    classifications = []
    for image in images:
        glioma, menin, no_t, pituitary = getSingleImagePrediction(image, network)

        classification = Classification(
            usage=usage,
            image=image,
            no_tumor_prob=round_decimal(no_t),
            pituitary_prob=round_decimal(pituitary),
            meningioma_prob=round_decimal(menin),
            glioma_prob=round_decimal(glioma),
        )
        classification.save()
        classifications.append(classification)
    return classifications


def single_image_check(request_data, files, user):
    network = loadNetwork()
    with transaction.atomic():
        patient = get_patient(request_data)
        image = get_image(files["photo"], patient)
        usage = Usage(doctor=user)
        usage.save()
        classification = evaluate_image(image, usage, network)

    return classification


def multiple_image_check(data, photos, user):
    network = loadNetwork()
    data = json.loads(data)
    patients = []
    images = []
    saved_photos = []
    with transaction.atomic():
        patients = get_patients_with_images(data)
        images, saved_photos = get_images(patients, photos)
        usage = Usage(doctor=user)
        usage.save()
        classifications = evaluate_images(images, usage, network)
        report = generate_report(classifications,usage)
    return saved_photos, usage, report


def generate_report(classifications, usage):
    df = pd.DataFrame(
        [
            {
                "name": c.image.photo.name,
                "patient_id": c.image.patient.id,
                "first_name": c.image.patient.first_name,
                "last_name": c.image.patient.last_name,
                "no_tumor": float(c.no_tumor_prob),
                "pituitary": float(c.pituitary_prob),
                "glioma": float(c.glioma_prob),
                "meningioma": float(c.meningioma_prob),
            }
            for c in classifications
        ]
    )
    df["max_value"] = df[["no_tumor", "pituitary", "glioma", "meningioma"]].max(axis=1)
    df["mean"] = df.groupby(by="patient_id")["max_value"].transform("mean")
    df = df.sort_values(by=["mean", "max_value"], ascending=False)
    df = df.drop(columns=["mean", "max_value"])

    intro = (
        "Patient Classification Report\n\n"
        "This report provides a detailed analysis of classified medical images, "
        "prioritizing the most confident predictions for each patient. Columns included:\n\n"
        "- `patient_id`: Unique identifier for the patient.\n"
        "- `name`: The filename of the analyzed image.\n"
        "- Probabilities (`no_tumor`, `pituitary`, `glioma`, `meningioma`): Confidence scores for each condition.\n\n"
        "Images were classified using a Convolutional Neural Network (CNN) architecture.\n\n"
    )
    buffer = StringIO()
    buffer.write(intro)
    buffer.write(df.to_string(index=False))
    buffer.seek(0)

    report = Report.objects.create(
        name=usage.date_of_creation.strftime("%Y-%m-%d %H:%M:%S"),
        file=ContentFile(
            buffer.getvalue(),
            name=f"report{usage.date_of_creation.strftime('%Y-%m-%d %H:%M:%S')}.txt",
        ),
    )
    usage.report = report
    usage.save()

    return report