# Generated by Django 5.1 on 2024-11-15 10:27

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_mlmodel_report_usage_classification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='image',
            name='photo',
            field=models.ImageField(unique=True, upload_to='Images'),
        ),
        migrations.AlterField(
            model_name='patient',
            name='PESEL',
            field=models.CharField(unique=True, validators=[django.core.validators.RegexValidator('^\\d{11}$', message='PESEL musi zawierać dokładnie 11 cyfr.')]),
        ),
    ]
