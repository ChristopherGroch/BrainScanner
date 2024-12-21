from django.contrib import admin
from .models import Patient, Image, Report, Classification, Usage

# Register your models here.

admin.site.register(Patient)
admin.site.register(Image)
admin.site.register(Report)
admin.site.register(Classification)
admin.site.register(Usage)
