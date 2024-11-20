from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator, RegexValidator
import os
from django.dispatch import receiver

class Patient(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    PESEL = models.CharField(
        validators=[
            RegexValidator(
                r"^\d{11}$", message="PESEL musi zawierać dokładnie 11 cyfr."
            )
        ],
        unique=True,
    )

    def __str__(self):
        return f"""PATIENT
    Name: {self.first_name}
    Last name: {self.last_name}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Image(models.Model):

    TUMOR_TYPES = (
        ("0", "not_classified"),
        ("1", "glioma"),
        ("2", "meningioma"),
        ("3", "pituitary"),
        ("4", "no_tumoe"),
    )

    tumor_type = models.CharField(
        max_length=20, choices=TUMOR_TYPES, blank=True, null=True
    )
    patient = models.ForeignKey(
        Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name="images"
    )
    classified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="classifications",
    )
    photo = models.ImageField(upload_to="Images",unique=True)
    
    hash = models.CharField(
        validators=[
            RegexValidator(
                r"^.{64}$", message="Hash musi zawierać dokładnie 64 znaków."
            )
        ],
        unique=True
    )

    def __str__(self):
        return f"""IMAGE
    Tumor type: {self.tumor_type}
    Patient: {self.patient}
    Classified by: {self.classified_by}
    Link: {self.photo}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
    


class MlModel(models.Model):
    accuracy = models.DecimalField(max_digits=7, decimal_places=7)
    pytorch_model = models.FileField(upload_to="MlModels")
    name = models.CharField(max_length=30, unique=True)

    def __str__(self) -> str:
        return f"""MODEL
    Name: {self.name} 
    Accuracy: {self.accuracy}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Report(models.Model):
    name = models.CharField(max_length=30)
    file = models.FileField(upload_to="reports")

    def __str__(self) -> str:
        return f"""REPORT
    Name: {self.name}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Usage(models.Model):
    doctor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="usages"
    )
    date_of_creation = models.DateTimeField(auto_now_add=True)
    report = models.OneToOneField(
        Report, on_delete=models.SET_NULL, null=True, blank=True
    )

    def __str__(self) -> str:
        return f"""USAGE
    Doctor: {self.doctor}
    Daate: {self.date_of_creation}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Classification(models.Model):
    usage = models.ForeignKey(
        Usage, on_delete=models.SET_NULL, null=True, related_name="classifications"
    )
    image = models.ForeignKey(
        Image, on_delete=models.SET_NULL, null=True, related_name="classifications"
    )
    ml_model = models.ForeignKey(
        MlModel, on_delete=models.SET_NULL, null=True, related_name="classifications"
    )
    no_tumor_prob = models.DecimalField(max_digits=8, decimal_places=7)
    pituitary_prob = models.DecimalField(max_digits=8, decimal_places=7)
    meningioma_prob = models.DecimalField(max_digits=8, decimal_places=7)
    glioma_prob = models.DecimalField(max_digits=8, decimal_places=7)

    def __str__(self) -> str:
        return f"""CLASSIFICATION
    No tomur prob: {self.no_tumor_prob}
    Meningioma prob: {self.meningioma_prob}
    Glioma prob: {self.glioma_prob}
    Pituitary prob: {self.pituitary_prob}"""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)



@receiver(models.signals.post_delete, sender=Image)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    if instance.photo:
        if os.path.isfile(instance.photo.path):
            os.remove(instance.photo.path)
            
@receiver(models.signals.post_delete, sender=Report)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    if instance.file:
        if os.path.isfile(instance.file.path):
            os.remove(instance.file.path)