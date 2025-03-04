"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from api.views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    logout,
    is_logged_in,
    single_image_classification,
    classifiy,
    change_password,
    getAllUsages,
    createUser,
    multipleImageCheck,
    getAllUsagesFiles,
    is_admin,
    getAllUsagesFrontFriendly,
    downloadFile,
    getAllUsagesFilesFrontFriendly,
    downloadReport,
    getAllPatients,
    change_patient,
    getAllImages,
    change_image,
    getAllUsers,
    change_user,
    reset_password,
    get_userName
)
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("api/logout/", logout),
    path("api/authcheck/", is_logged_in),
    path("api/singleImageClassification/", single_image_classification),
    path("api/classify/<int:pk>/", classifiy),
    path("api/changePassword/<int:pk>/", change_password),
    path("api/changePatient/<int:pk>/", change_patient),
    path("api/changeImage/<int:pk>/", change_image),
    path("api/changeUser/<int:pk>/", change_user),
    path("api/resetPassword/<int:pk>/", reset_password),
    path("api/history/", getAllUsages),
    path("api/getUsages/",getAllUsagesFrontFriendly),
    path("api/createUser/", createUser),
    path("api/checkMultipleFiles/", multipleImageCheck),
    path("api/getReports/", getAllUsagesFiles),
    path("api/getUsageReports/", getAllUsagesFilesFrontFriendly),
    path("api/checkAdmin/",is_admin),
    path("api/downloadFile/",downloadFile),
    path("api/downloadReport/",downloadReport),
    path("api/getAllPatients/",getAllPatients),
    path("api/getAllImages/",getAllImages),
    path("api/getAllUsers/",getAllUsers),
    path("api/getUserName/",get_userName)
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
