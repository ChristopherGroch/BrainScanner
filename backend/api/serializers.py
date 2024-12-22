from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.validators import RegexValidator

from .models import Patient, Image, Report, Classification, Usage, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "id"]


class UserCreateSerializer(serializers.ModelSerializer):
    PESEL = serializers.CharField(
        write_only=True,
        required=True,
        validators=[
            RegexValidator(
                r"^\d{11}$", message="PESEL musi zawierać dokładnie 11 cyfr."
            )
        ],
    )

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "PESEL"]


class UserChangeSerializer(serializers.ModelSerializer):
    PESEL = serializers.CharField(
        write_only=True,
        required=True,
        validators=[
            RegexValidator(
                r"^\d{11}$", message="PESEL musi zawierać dokładnie 11 cyfr."
            )
        ],
    )

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "PESEL"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["PESEL"]


class UserGetAllSerializer(serializers.ModelSerializer):
    userprofile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "userprofile"]


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ["first_name", "last_name", "email", "PESEL", "id"]


class ImageSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)

    class Meta:
        model = Image
        fields = "__all__"


class ImageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = "__all__"


# class MlModelSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = MlModel
#         fields = ["name"]


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"


class ClassificationSerializer(serializers.ModelSerializer):
    # usage = UsageSerializer()
    image = ImageSerializer()

    class Meta:
        model = Classification
        fields = [
            # "usage",
            "id",
            "image",
            "no_tumor_prob",
            "pituitary_prob",
            "meningioma_prob",
            "glioma_prob",
        ]
        extra_kwargs = {"usage": {"read_only": True}}


class UsageSerializer(serializers.ModelSerializer):
    classifications = ClassificationSerializer(many=True, read_only=True)

    class Meta:
        model = Usage
        fields = "__all__"


class UsageFilesSerializer(serializers.ModelSerializer):
    report = ReportSerializer(read_only=True)

    class Meta:
        model = Usage
        fields = "__all__"


# ims = ImageSerializer(Image.objects.all(),many=True)
# print(ims.data)
# print(Image.objects.get(id=3))
# im = Image.objects.get(id=3)
# print(im)
# print(ImageSerializer(im).data)
# per = Patient.objects.get(id=3)
# print()
# print(per.images.all())
