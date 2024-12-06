from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.http import FileResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import get_object_or_404
from collections import defaultdict
from django.core.files.base import ContentFile
from .serializers import (
    UserSerializer,
    PatientSerializer,
    ImageSerializer,
    ClassificationSerializer,
    ReportSerializer,
    UsageSerializer,
    UsageFilesSerializer,
    UserCreateSerializer,
    UserChangeSerializer
)
from django.core.exceptions import ValidationError
from rest_framework.decorators import parser_classes
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework import status
import json
from rest_framework.parsers import MultiPartParser, JSONParser
from .models import Patient, Usage, Classification, MlModel, Image, Report
from .utils import (
    checkIfImageExists,
    getSingleImagePrediction,
    sendEmail,
    generate_password,
    generatePasswordFile,
    generateZipFile,
    loadNetwork,
    frontedHappyReformatHistory
)
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction, connection
import os
import pandas as pd
from io import StringIO


class CookieTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            refresh = request.COOKIES.get("refresh")
            data["refresh"] = refresh
            request._full_data = data
            response = super().post(request, *args, **kwargs)
            data = response.data
            access = data["access"]
            response = Response({"refreshed": True})

            response.set_cookie(
                key="access",
                value=access,
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )
            return response

        except Exception as e:
            return Response(
                {"refreshed": False, "reason": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        
        # x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        # if x_forwarded_for:
        #     ip = x_forwarded_for.split(',')[0]
        # else:
        #     ip = request.META.get('REMOTE_ADDR')
        # print(ip)

        try:
            response = super().post(request, *args, **kwargs)
            data = response.data
            access = data["access"]
            refresh = data["refresh"]
            response = Response({"success": True})

            response.set_cookie(
                key="access",
                value=f"{access}",
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )

            response.set_cookie(
                key="refresh",
                value=f"{refresh}",
                httponly=True,
                secure=True,
                samesite="None",
                path="/",
            )
            return response
        except Exception as e:
            return Response(
                {"success": False, "reason": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response({"success": True})
        res.delete_cookie("access", path="/", samesite="None")
        res.delete_cookie("refresh", path="/", samesite="None")
        return res
    except Exception as e:
        return Response({"succes": False}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_logged_in(request):
    serializer = UserSerializer(request.user, many=False)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_admin(request):
    return Response({'is_admin':request.user.is_superuser})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def classifiy(request, pk):
    try:
        image = Image.objects.get(id=pk)
    except Image.DoesNotExist:
        return Response('No such file',status=status.HTTP_404_NOT_FOUND)
    if image.tumor_type is not None:
        return Response('Tumor already classified',status=status.HTTP_400_BAD_REQUEST)
    if not 'tumor_type' in request.data:
        return Response('No tumor type key',status=status.HTTP_400_BAD_REQUEST)
    image.tumor_type = request.data["tumor_type"]
    image.classified_by = request.user
    try:
        image.save()
    except ValidationError as e:
        return Response({'reason':str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'reason':str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(ImageSerializer(image).data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_password(request, pk):
    user = request.user
    # if user.id != pk:
    #     return Response({"error": "Bad user ID"})
    if not "new_password" in request.data:
        return Response(
            {"success": False, "reason": "No new password field"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if user.check_password(request.data["new_password"]):
        return Response(
            {"success": False, "reason": "Password is the same"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.set_password(request.data["new_password"])
    user.save()
    response = Response(UserSerializer(user).data)
    response.delete_cookie("access", path="/", samesite="None")
    response.delete_cookie("refresh", path="/", samesite="None")
    return response

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def reset_password(request, pk):
    user = get_object_or_404(User, pk=pk)
    print(request.data)
    password = generate_password()
    user.set_password(password)
    password_file = generatePasswordFile(password=password)
    zip_file = generateZipFile(password_file=password_file, PESEL=request.data["PESEL"])
    sendEmail(user.email, zip_file)
    if os.path.exists(password_file):
        os.remove(password_file)
    if os.path.exists(zip_file):
        os.remove(zip_file)
    
    user.save()
    return Response({"message": "User updated successfully!"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_userName(request):
    user = request.user
    return Response({'user':f'{user.first_name} {user.last_name}'}, status=status.HTTP_200_OK)
    
@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_user(request, pk):
    user = get_object_or_404(User, pk=pk)
    data = request.data
    for field in ['first_name', 'last_name', 'username']:
        if field in data:
            setattr(user, field, data[field])
    password = 'password'
    if 'email' in data:
        if 'PESEL' in data:
            setattr(user, 'email', data['email'])
            password = generate_password()
            user.set_password(password)
        else:
            return Response({'reason':"No PESEL key"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user.save()
        if 'email' in data:
            password_file = generatePasswordFile(password=password)
            zip_file = generateZipFile(password_file=password_file, PESEL=request.data["PESEL"])
            sendEmail(user.email, zip_file)
            if os.path.exists(password_file):
                os.remove(password_file)
            if os.path.exists(zip_file):
                os.remove(zip_file)
        return Response({"message": "User updated successfully!"}, status=status.HTTP_200_OK)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_patient(request, pk):
    patient = get_object_or_404(Patient, pk=pk)
    data = request.data
    for field in ['first_name', 'last_name', 'email', 'PESEL']:
        if field in data:
            setattr(patient, field, data[field])
    try:
        patient.save()
        return Response({"message": "Patient updated successfully!"}, status=status.HTTP_200_OK)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_image(request, pk):
    image = get_object_or_404(Image, pk=pk)
    data = request.data
    if 'patient' in data:
        patient = get_object_or_404(Patient, pk=data['patient'])
        setattr(image, 'patient', patient)
    if 'tumor_type' in data:
        if data['tumor_type'] == '0':
            setattr(image, 'tumor_type', None)
        else:
            setattr(image, 'tumor_type', data['tumor_type'])
        setattr(image, 'classified_by',request.user)
    try:
        image.save()
        return Response({"message": "Image updated successfully!"}, status=status.HTTP_200_OK)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, JSONParser])
def single_image_classification(request):
    serializer = UserSerializer(request.user, many=False)
    try:
        network,best_model = loadNetwork()
    except Exception as e:
        return Response({'reason':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    if not 'patient' in request.data:
        return Response({'reason':'No patient key'},status=status.HTTP_400_BAD_REQUEST)
    if not 'photo' in request.FILES:
        return Response({'reason':'No photo key'},status=status.HTTP_400_BAD_REQUEST)
    
    data = json.loads(request.data.get("patient"))
    data = {"patient": data}
    data["photo"] = request.FILES["photo"]

    try:
        with transaction.atomic():
            if "id" in data["patient"]:
                patient = Patient.objects.get(id=data["patient"]["id"])
            else:
                patient = PatientSerializer(data=data["patient"])
                if patient.is_valid():
                    patient = patient.create(patient.validated_data)
                else:
                    raise IntegrityError(f"{patient.errors}")
                    # return Response(
                    #     {"error": str(patient.errors)}, status=status.HTTP_400_BAD_REQUEST
                    # )

            im_bytes = data["photo"].read()
            ob, im_hash = checkIfImageExists(im_bytes)
            if ob:
                if ob.patient.PESEL != patient.PESEL:
                    raise IntegrityError(
                        f"Exact imaage exists and its different patient"
                    )
                    # return Response(
                    #     {"error": "Exact imaage exists and its different patient"},
                    #     status=status.HTTP_400_BAD_REQUEST,
                    # )
                else:
                    image = ob
            else:
                data["photo"].seek(0)
                data["hash"] = im_hash
                image = ImageSerializer(data=data)
                if image.is_valid():
                    image = image.create(image.validated_data)
                else:
                    raise IntegrityError(f"{image.errors}")
                    # return Response(
                    #     {"error": str(image.errors)}, status=status.HTTP_400_BAD_REQUEST
                    # )
                image.patient = patient
                image.save()

    except IntegrityError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    user = User.objects.get(id=serializer.data["id"])
    usage = Usage(doctor=user)
    usage.save()
    try:
        glioma, menin, no_t, pituitary = (getSingleImagePrediction(image,network))
    except Exception as e:
        return Response({'reason':str(e)},status=status.HTTP_400_BAD_REQUEST)
    classification = Classification(
        usage=usage,
        image=image,
        ml_model=best_model,
        no_tumor_prob=Decimal(round(float(no_t), 7)).quantize(
            Decimal("0.0000001"), rounding=ROUND_HALF_UP
        ),
        pituitary_prob=Decimal(round(float(pituitary), 7)).quantize(
            Decimal("0.0000001"), rounding=ROUND_HALF_UP
        ),
        meningioma_prob=Decimal(round(float(menin), 7)).quantize(
            Decimal("0.0000001"), rounding=ROUND_HALF_UP
        ),
        glioma_prob=Decimal(round(float(glioma), 7)).quantize(
            Decimal("0.0000001"), rounding=ROUND_HALF_UP
        ),
    )
    classification.save()
    seria = ClassificationSerializer(classification)
    return Response(seria.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsages(request):
    usages = Usage.objects.filter(doctor=request.user).all()
    return Response(UsageSerializer(usages, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllPatients(request):
    usages = Patient.objects.filter().all()
    return Response(PatientSerializer(usages, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsers(request):
    users = User.objects.filter(is_superuser=False)
    return Response(UserChangeSerializer(users, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsagesFrontFriendly(request):
    usages = Usage.objects.filter(doctor=request.user).all().order_by('-date_of_creation')
    response_data = frontedHappyReformatHistory(UsageSerializer(usages,many=True).data)
    return Response(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsagesFiles(request):
    usages = Usage.objects.filter(doctor=request.user).all()
    return Response(UsageFilesSerializer(usages, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllImages(request):
    images = Image.objects.all()
    return Response(ImageSerializer(images, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsagesFilesFrontFriendly(request):
    usages = Usage.objects.filter(doctor=request.user).exclude(report__isnull=True).order_by('-date_of_creation')

    response_data = []

    for usage in usages:
        report_data = {
            "report": UsageFilesSerializer(usage).data,
            "patients": []
        }

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

    return Response(response_data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def downloadFile(request):
    image = Image.objects.get(id=request.data['id'])
    file_path = image.photo.path
    response = FileResponse(open(file_path, 'rb'))
    response['Content-Type'] = 'application/octet-stream'
    response['Content-Disposition'] = f'attachment; filename="{image.photo.name}"'
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def downloadReport(request):
    report = Report.objects.get(id=request.data['id'])
    file_path = report.file.path
    response = FileResponse(open(file_path, 'rb'))
    response['Content-Type'] = 'application/octet-stream'
    response['Content-Disposition'] = f'attachment; filename="{report.file.name}"'
    return response


@api_view(["POST"])
@permission_classes([IsAdminUser])
def createUser(request):
    password = generate_password()
    userserializer = UserCreateSerializer(data=request.data)
    if not userserializer.is_valid():
        return Response({'reason':str(userserializer.errors)},status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(
        username=request.data["username"],
        first_name=request.data["first_name"],
        last_name=request.data["last_name"],
        email=request.data["email"],
        password=password,
    )
    password_file = generatePasswordFile(password=password)
    zip_file = generateZipFile(password_file=password_file, PESEL=request.data["PESEL"])
    sendEmail(user.email, zip_file)
    if os.path.exists(password_file):
        os.remove(password_file)
    if os.path.exists(zip_file):
        os.remove(zip_file)
    return Response(user.id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def multipleImageCheck(request):
    try:
        network,best_model = loadNetwork()
    except Exception as e:
        return Response({'reason':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if not 'patients' in request.data:
        return Response({'reason':'No patients key'},status=status.HTTP_400_BAD_REQUEST)
    if not 'photos' in request.FILES:
        return Response({'reason':'No photos key'},status=status.HTTP_400_BAD_REQUEST)
    
    try:
        df = pd.DataFrame(columns=["name", "patient_id",'first_name','last_name'])
        data = json.loads(request.data["patients"])
        photos = request.FILES.getlist("photos")
        photos_dict = {photo.name: photo for photo in photos}
        patients = []
        images = []
        saved_photos = []
        with transaction.atomic():
            for p in data:
                if "id" in p:
                    patient = Patient.objects.get(id=p["id"])
                    patient.cur_images = p["images"]
                    patients.append(patient)
                else:
                    patient = PatientSerializer(data=p)
                    if patient.is_valid():
                        patient = patient.create(patient.validated_data)
                        patient.cur_images = p["images"]
                        patients.append(patient)
                    else:
                        raise IntegrityError(f"{patient.errors} {p['first_name']} {p['last_name']}")

            for patient in patients:
                for name in patient.cur_images:
                    df.loc[len(df)] = [name, patient.id,patient.first_name,patient.last_name]
                    im_bytes = photos_dict[name].read()
                    ob, im_hash = checkIfImageExists(im_bytes)
                    if ob:
                        if ob.patient.PESEL != patient.PESEL:
                            raise IntegrityError(
                                f"Exact imaage exists and its different patient. Image {name}, patient {patient.first_name} {patient.last_name}, exisitng patient {ob.patient.first_name} {ob.patient.last_name}"
                            )
                        else:
                            images.append(ob)
                    else:
                        photos_dict[name].seek(0)
                        data = {"photo": photos_dict[name], "hash": im_hash}
                        image = ImageSerializer(data=data)
                        if image.is_valid():
                            image = image.create(image.validated_data)
                            saved_photos.append(image.photo.path)
                        else:
                            raise IntegrityError(f"{image.errors}")
                        image.patient = patient
                        image.save()
                        images.append(image)
                    photos_dict[name].seek(0)
    except IntegrityError as e:
        for file_path in saved_photos:
            if os.path.exists(file_path):
                os.remove(file_path)
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        for file_path in saved_photos:
            if os.path.exists(file_path):
                os.remove(file_path)
        return Response(
            {"reason": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    user = request.user
    usage = Usage(doctor=user)
    usage.save()

    df["no_tumor"] = 0.0
    df["pituitary"] = 0.0
    df["glioma"] = 0.0
    df["meningioma"] = 0.0

    i = 0

    for image in images:
        glioma, menin, no_t, pituitary = (getSingleImagePrediction(image,network))
        no_t = round(float(no_t), 7)
        glioma = round(float(glioma), 7)
        menin = round(float(menin), 7)
        pituitary = round(float(pituitary), 7)

        df.loc[i, "no_tumor"] = no_t
        df.loc[i, "pituitary"] = pituitary
        df.loc[i, "glioma"] = glioma
        df.loc[i, "meningioma"] = menin

        classification = Classification(
            usage=usage,
            image=image,
            ml_model=best_model,
            no_tumor_prob=Decimal(no_t).quantize(
                Decimal("0.0000001"), rounding=ROUND_HALF_UP
            ),
            pituitary_prob=Decimal(pituitary).quantize(
                Decimal("0.0000001"), rounding=ROUND_HALF_UP
            ),
            meningioma_prob=Decimal(menin).quantize(
                Decimal("0.0000001"), rounding=ROUND_HALF_UP
            ),
            glioma_prob=Decimal(glioma).quantize(
                Decimal("0.0000001"), rounding=ROUND_HALF_UP
            ),
        )
        classification.save()
        i += 1
    df["max_value"] = df[["no_tumor", "pituitary", "glioma", "meningioma"]].max(axis=1)
    df["mean"] = df.groupby(by="patient_id")["max_value"].transform("mean")
    df = df.sort_values(by=["mean", "max_value"], ascending=False)
    buffer = StringIO()
    buffer.write("ddddddddddddddddddddddddddddddddd\n") 
    df.to_string(buffer, index=False)
    buffer.seek(0)
    usage.refresh_from_db()
    report = Report.objects.create(
        name=usage.date_of_creation.strftime("%Y-%m-%d %H:%M:%S"),
        file=ContentFile(
            buffer.getvalue(),
            name=f"report{usage.date_of_creation.strftime('%Y-%m-%d %H:%M:%S')}.txt",
        ),
    )
    usage_data = UsageSerializer(usage).data
    usage_data["report"] = report.file.url
    usage_data["reportID"] = report.id
    usage.report = report
    usage.save()
    return Response(usage_data)
