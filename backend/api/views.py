from django.http import FileResponse, Http404
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.contrib.auth.models import User
from django.core.files.storage import default_storage

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from rest_framework.parsers import MultiPartParser, JSONParser

from .serializers import (
    UserSerializer,
    PatientSerializer,
    ImageSerializer,
    UserGetAllSerializer,
    ClassificationSerializer,
    UsageSerializer,
    UsageFilesSerializer,
)
from .models import (
    Patient,
    Usage,
    NetowrkException,
    Image,
    Report,
    SamePasswordExcpetion,
    TumorClassified,
)
from .utils import (
    cleanup_saved_photos,
    fronted_happy_reformat_history,
    prepare_all_usages,
)
from .services.image_service import classify_image, change_image_data
from .services.user_service import (
    change_user_password,
    reset_user_password,
    create_user,
    change_user_data,
)
from .services.patient_service import change_patient_data
from .services.usage_service import single_image_check, multiple_image_check


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
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
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
        return Response(
            {"succes": False, "reason": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_logged_in(request):
    serializer = UserSerializer(request.user, many=False)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_admin(request):
    return Response({"is_admin": request.user.is_superuser})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def classifiy(request, pk):
    if not "tumor_type" in request.data:
        return Response("No tumor type key", status=status.HTTP_400_BAD_REQUEST)
    try:
        return_image = classify_image(pk, request.data["tumor_type"], request.user)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        return Response("No such file", status=status.HTTP_404_NOT_FOUND)
    except TumorClassified:
        return Response("Tumor already classified", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"reason": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    return Response(ImageSerializer(return_image).data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_password(request, pk): # pylint: disable=unused-argument
    if not "new_password" in request.data:
        return Response(
            {"success": False, "reason": "No new password field"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user = request.user
    try:
        return_user = change_user_password(user, request.data["new_password"])
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except SamePasswordExcpetion:
        return Response(
            {"success": False, "reason": "Password is the same"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"reason": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    response = Response(UserSerializer(return_user).data)
    response.delete_cookie("access", path="/", samesite="None")
    response.delete_cookie("refresh", path="/", samesite="None")
    return response


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def reset_password(request, pk):

    try:
        reset_user_password(pk)
    except Http404:
        return Response({"reason": "No such file"}, status=status.HTTP_404_NOT_FOUND)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"reason": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response(
        {"message": "User updated successfully!"}, status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_userName(request):
    user = request.user
    return Response(
        {"user": f"{user.first_name} {user.last_name}"}, status=status.HTTP_200_OK
    )


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_user(request, pk):
    try:
        change_user_data(pk, request.data)
        return Response(
            {"message": "User updated successfully!"}, status=status.HTTP_200_OK
        )
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        return Response({"reason": "No such user"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_patient(request, pk):
    try:
        change_patient_data(pk, request.data)
        return Response(
            {"message": "Patient updated successfully!"}, status=status.HTTP_200_OK
        )
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        return Response({"reason": "No such patient"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def change_image(request, pk):
    patient = None
    tumor_type = None
    if "patient" in request.data:
        patient = request.data["patient"]
    if "tumor_type" in request.data:
        tumor_type = request.data["tumor_type"]
    try:
        change_image_data(pk, request.user, tumor_type, patient)
        return Response(
            {"message": "Image updated successfully!"}, status=status.HTTP_200_OK
        )
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404:
        return Response({"reason": "No such image"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, JSONParser])
def single_image_classification(request):
    if not "patient" in request.data:
        return Response(
            {"reason": "No patient key"}, status=status.HTTP_400_BAD_REQUEST
        )
    if not "photo" in request.FILES:
        return Response({"reason": "No photo key"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        classification = single_image_check(request.data, request.FILES, request.user)
        seria = ClassificationSerializer(classification)
        return Response(seria.data, status=status.HTTP_200_OK)
    except NetowrkException as e:
        return Response(
            {"reason": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except IntegrityError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404 as e:
        return Response({"reason": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
    return Response(UserGetAllSerializer(users, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getAllUsagesFrontFriendly(request):
    usages = (
        Usage.objects.filter(doctor=request.user).all().order_by("-date_of_creation")
    )
    response_data = fronted_happy_reformat_history(
        UsageSerializer(usages, many=True).data
    )
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
    usages = (
        Usage.objects.filter(doctor=request.user)
        .exclude(report__isnull=True)
        .order_by("-date_of_creation")
    )

    return Response(prepare_all_usages(usages))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def downloadFile(request):
    image = Image.objects.get(id=request.data["id"])
    file_path = image.photo.path
    response = FileResponse(open(file_path, "rb"))
    response["Content-Type"] = "image/png"
    response["Content-Disposition"] = f'attachment; filename="{image.photo.name}"'
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def downloadReport(request):
    report = Report.objects.get(id=request.data["id"])
    file_path = report.file.path
    response = FileResponse(open(file_path, "rb"))
    response["Content-Type"] = "application/octet-stream"
    response["Content-Disposition"] = f'attachment; filename="{report.file.name}"'
    return response


@api_view(["POST"])
@permission_classes([IsAdminUser])
def createUser(request):
    try:
        user = create_user(request.data)
    except ValidationError as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(user.id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def multipleImageCheck(request):
    if not "patients" in request.data:
        return Response(
            {"reason": "No patients key"}, status=status.HTTP_400_BAD_REQUEST
        )
    if not "photos" in request.FILES:
        return Response({"reason": "No photos key"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        saved_photos = []
        usage, report = multiple_image_check(
            request.data["patients"],
            request.FILES.getlist("photos"),
            request.user,
            saved_photos,
        )
        usage_data = UsageSerializer(usage).data
        usage_data["report"] = report.file.url
        usage_data["reportID"] = report.id
        return Response(usage_data)
    except NetowrkException as e:
        cleanup_saved_photos(saved_photos)
        return Response(
            {"reason": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except IntegrityError as e:
        cleanup_saved_photos(saved_photos)
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError as e:
        cleanup_saved_photos(saved_photos)
        return Response({"reason": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Http404 as e:
        cleanup_saved_photos(saved_photos)
        return Response({"reason": str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        cleanup_saved_photos(saved_photos)
        return Response(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    