from django.db import transaction
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from ..models import SamePasswordExcpetion, UserProfile
from ..utils import (
    send_email,
    generate_password,
    generate_password_file,
    delete_file,
    generate_zip_file,
)
from ..serializers import UserCreateSerializer


def change_user_password(user, new_password):
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
    password_file = generate_password_file(password=password)
    zip_file = generate_zip_file(
        password_file=password_file, PESEL=user.userprofile.PESEL
    )
    send_email(user.email, zip_file, user.username)
    delete_file(password_file)
    delete_file(zip_file)
    user.save()


def change_user_data(pk, data):
    user = get_object_or_404(User, pk=pk)
    user_profile = get_object_or_404(UserProfile, user=user)
    for field in ["first_name", "last_name", "username", "email"]:
        if field in data:
            setattr(user, field, data[field])

    if "PESEL" in data:
        setattr(user_profile, "PESEL", data["PESEL"])
    with transaction.atomic():
        user.full_clean()
        user.save()
        user_profile.save()


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
    password_file = generate_password_file(password=password)
    zip_file = generate_zip_file(
        password_file=password_file, PESEL=user.userprofile.PESEL
    )
    send_email(user.email, zip_file, user.username)
    delete_file(password_file)
    delete_file(zip_file)
    return user
