import json

from django.shortcuts import get_object_or_404

from ..models import Patient
from ..serializers import PatientSerializer



def change_patient_data(pk, data):
    patient = get_object_or_404(Patient, pk=pk)
    for field in ["first_name", "last_name", "email", "PESEL"]:
        if field in data:
            setattr(patient, field, data[field])
    patient.save()


def get_patient(data):
    data = json.loads(data.get("patient"))
    if "id" in data:
        return get_object_or_404(Patient, pk=data["id"])
    patient = PatientSerializer(data=data)
    if not patient.is_valid():
        raise ValueError(f"{patient.errors}")
    else:
        return patient.create(patient.validated_data)

def get_patients_with_images(data):
    patients = []
    for p in data:
        if "id" in p:
            patient = get_object_or_404(Patient, pk=p["id"])
            patient.cur_images = p["images"]
        else:
            patient = PatientSerializer(data=p)
            if not patient.is_valid():
                raise ValueError(f"{patient.errors} {p['first_name']} {p['last_name']}")
            patient = patient.create(patient.validated_data)
            patient.cur_images = p["images"]
        patients.append(patient)
    return patients
