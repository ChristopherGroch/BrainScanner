from django.db import transaction
from ..models import SamePasswordExcpetion
from django.contrib.auth.models import User
import os
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from ..models import UserProfile
from ..utils import (
    checkIfImageExists,
    getSingleImagePrediction,
    sendEmail,
    generate_password,
    generatePasswordFile,
    delete_file,
    generateZipFile,
    loadNetwork,
    frontedHappyReformatHistory,
    addImageToDataset
)
from ..serializers import UserCreateSerializer

def change_user_password(user,new_password):
    if user.check_password(new_password):
        raise SamePasswordExcpetion
    user.set_password(new_password)
    with transaction.atomic():
        user.save()
    return user

def reset_user_password(pk):
    user = get_object_or_404(User, pk=pk)
    password = generate_password()
    user.set_password(password)
    password_file = generatePasswordFile(password=password)
    zip_file = generateZipFile(
        password_file=password_file, PESEL=user.userprofile.PESEL
    )
    sendEmail(user.email, zip_file, user.username)
    delete_file(password_file)
    delete_file(zip_file)
    user.save()
    
def change_user_data(pk,data):
    user = get_object_or_404(User, pk=pk)
    userProfile = get_object_or_404(UserProfile, user=user)
    for field in ["first_name", "last_name", "username", "email"]:
        if field in data:
            setattr(user, field, data[field])

    if "PESEL" in data:
        setattr(userProfile, "PESEL", data["PESEL"])
    with transaction.atomic():
        user.full_clean()
        user.save()
        userProfile.save()
    
def create_user(data):
    userserializer = UserCreateSerializer(data=data)
    if not userserializer.is_valid():
        raise ValidationError(userserializer.errors)
    password = generate_password()
    with transaction.atomic():
        user = User.objects.create_user(
                username=data["username"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
                password=password,
            )
        UserProfile.objects.create(user=user, PESEL=data["PESEL"])
    password_file = generatePasswordFile(password=password)
    zip_file = generateZipFile(
        password_file=password_file, PESEL=user.userprofile.PESEL
    )
    sendEmail(user.email, zip_file, user.username)
    delete_file(password_file)
    delete_file(zip_file)
    return user