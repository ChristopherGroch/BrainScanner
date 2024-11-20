from django.test import TestCase, Client, override_settings
from .models import Patient, Image, MlModel, Classification, Usage, Report
from PIL import Image as pilImage
from django.contrib.auth.models import User
from .serializers import PatientSerializer, ImageSerializer, UserSerializer
from django.core.exceptions import ValidationError
import io
from django.core.files.uploadedfile import SimpleUploadedFile
import os
from django.core.files.base import ContentFile
import json
from django.core import mail
from decimal import Decimal
import datetime

# from .utils import saveBlankPILimage, checkIfImageHasDuplicate


def createUploadImage(path, i):
    with open(path, "rb") as image_file:
        uploaded_image = SimpleUploadedFile(
            name=f"test_image{i}.jpg",
            content=image_file.read(),
            content_type="image/jpeg",
        )
    return uploaded_image


class PatientModel(TestCase):

    def setUp(self):
        self.patient = Patient.objects.create(
            first_name="Test",
            last_name="Tests",
            email="test@test.com",
            PESEL="11111111111",
        )

    def test_basic(self):
        self.assertEqual(self.patient.first_name, "Test")
        self.assertEqual(self.patient.last_name, "Tests")
        self.assertEqual(self.patient.email, "test@test.com")
        self.assertEqual(self.patient.PESEL, "11111111111")
        self.assertTrue(isinstance(self.patient, Patient))

    def testCRUD(self):
        p = Patient.objects.get(id=self.patient.id)
        self.assertEqual(p, self.patient)
        self.assertEqual(p.first_name, self.patient.first_name)
        self.assertEqual(p.last_name, self.patient.last_name)
        self.assertEqual(p.email, self.patient.email)
        self.assertEqual(p.PESEL, self.patient.PESEL)
        self.assertFalse(p is self.patient)
        self.assertEqual(Patient.objects.all().count(), 1)

        try:
            self.patient.save()
        except Exception as e:
            print(e)
            self.fail()

        with self.assertRaises(ValidationError):
            self.patient.email = "das"
            self.patient.save()

        with self.assertRaises(ValidationError):
            self.patient.PESEL = "212"
            self.patient.save()

        with self.assertRaises(ValidationError):
            self.patient.PESEL = "2122222222f"
            self.patient.save()
        self.patient.refresh_from_db()
        p.first_name = "Test2"
        p.save()
        patv2 = Patient.objects.get(id=self.patient.id)
        self.assertEqual(patv2.first_name, "Test2")
        pat2 = Patient(
            first_name="Pat2", last_name="FFF", email="fifa@ds.com", PESEL="22334444444"
        )
        pat2.save()
        self.assertEqual(Patient.objects.all().count(), 2)

        pat2.delete()
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Patient.objects.all().first(), self.patient)

        pat2.email = "test@test.com"
        with self.assertRaises(ValidationError):
            pat2.save()
        pat2.email = "test2@test.com"
        with self.assertRaises(ValidationError):
            pat2.PESEL = "11111111111"
            pat2.save()

        pat2.PESEL = "11111111112"
        with self.assertRaises(ValidationError):
            pat2.first_name = ""
            pat2.save()
        pat2.first_name = "f"
        with self.assertRaises(ValidationError):
            pat2.last_name = ""
            pat2.save()
        with self.assertRaises(ValidationError):
            pat2.last_name = "llkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"
            pat2.save()

    def testSerializer(self):
        serializer = PatientSerializer(self.patient)
        self.assertEqual(serializer.data["first_name"], "Test")
        self.assertEqual(serializer.data["last_name"], "Tests")
        self.assertEqual(serializer.data["email"], "test@test.com")
        self.assertEqual(serializer.data["PESEL"], "11111111111")

        data = {
            "first_name": "fifka",
            "last_name": "rafa",
            "email": "test@d.com",
            "PESEL": "88888888888",
        }
        pat = PatientSerializer(data=data)
        self.assertTrue(pat.is_valid())
        pat_ob = pat.create(pat.validated_data)
        self.assertTrue(isinstance(pat_ob, Patient))
        self.assertEqual(Patient.objects.all().last(), pat_ob)

        data = {
            "first_name": "fifka",
            "last_name": "rafa",
            "email": "test2@d.com",
            "PESEL": "88887888888",
        }
        pat = PatientSerializer(data=data)
        with self.assertRaises(AssertionError):
            pat.save()
        self.assertTrue(pat.is_valid())
        pat.save()
        self.assertEqual(Patient.objects.all().count(), 3)

        data = {
            "first_name": "fifka",
            "last_name": "rafa",
            "email": "test32@d.com",
            "PESEL": "82887888888",
            "id": 1,
            "something": "dsa",
        }
        pat = PatientSerializer(data=data)
        self.assertTrue(pat.is_valid())
        ob = pat.create(pat.validated_data)
        self.assertNotEqual(ob.id, 1)
        self.assertEqual(Patient.objects.all().count(), 4)
        with self.assertRaises(AttributeError):
            print(ob.something)

        data = {
            "first_name": "fifka",
            "last_name": "rafa",
            "email": "test2@d.com",
            "PESEL": "88887888888",
        }
        pat = PatientSerializer(data=data)
        self.assertFalse(pat.is_valid())
        with self.assertRaises(AssertionError):
            pat.save()

        data["email"] = "gfg@hh.com"
        data["PESEL"] = "12222222228"
        pat = PatientSerializer(data=data)
        self.assertTrue(pat.is_valid())

        data["email"] = "gfg@hh.com"
        data["PESEL"] = "122222f2228"
        pat = PatientSerializer(data=data)
        self.assertFalse(pat.is_valid())

        data["email"] = "gfg@hh.com"
        data["PESEL"] = "12222222228"
        pat = PatientSerializer(data=data)
        self.assertTrue(pat.is_valid())

        data["email"] = "gfg@hh.com"
        data["PESEL"] = "122222522328"
        pat = PatientSerializer(data=data)
        self.assertFalse(pat.is_valid())

        data["email"] = "gfg@hh.com"
        data["PESEL"] = "12222222228"
        pat = PatientSerializer(data=data)
        self.assertTrue(pat.is_valid())

        data["email"] = "gfg@hhcom"
        data["PESEL"] = "12222252232"
        pat = PatientSerializer(data=data)
        self.assertFalse(pat.is_valid())


class AuthenticatedTest(TestCase):

    def testNotLoggedUser(self):
        client = Client()

        response = client.post("/api/token/")
        self.assertNotEqual(response.status_code, 401)

        response = client.post("/api/token/refresh/")
        self.assertNotEqual(response.status_code, 401)

        response = client.post("/api/logout/")
        self.assertEqual(response.status_code, 401)

        response = client.get("/api/authcheck/")
        self.assertEqual(response.status_code, 401)

        response = client.post("/api/singleImageClassification/")
        self.assertEqual(response.status_code, 401)

        response = client.put("/api/classify/1/")
        self.assertEqual(response.status_code, 401)

        response = client.put("/api/changePassword/1/")
        self.assertEqual(response.status_code, 401)

        response = client.get("/api/history/")
        self.assertEqual(response.status_code, 401)

        response = client.get("/api/getReports/")
        self.assertEqual(response.status_code, 401)

        response = client.post("/api/createUser/")
        self.assertEqual(response.status_code, 401)

        response = client.post("/api/checkMultipleFiles/")
        self.assertEqual(response.status_code, 401)

    def testLogIn(self):
        client = Client()
        user = User(username="Test")
        user.set_password("Test")
        user.save()

        response = client.post("/api/token/", {"username": "Test3", "password": "Test"})
        self.assertFalse(response.data["success"])
        self.assertEqual(response.status_code, 400)

        response = client.post("/api/token/", {"username": "Test", "password": "Test"})
        self.assertTrue(response.data["success"])
        self.assertEqual(response.status_code, 200)

        access_token = response.cookies["access"]
        refresh_token = response.cookies["refresh"]

        self.assertIsNotNone(access_token)
        self.assertIsNotNone(refresh_token)

        client.cookies["access"] = access_token.value
        client.cookies["refresh"] = refresh_token.value

        response = client.get("/api/history/")
        self.assertEqual(response.status_code, 200)

        response = client.get("/api/authcheck/")
        self.assertNotEqual(response.status_code, 401)

        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertNotEqual(client.cookies["refresh"].value, "")

        response = client.post("/api/logout/")
        self.assertEqual(response.status_code, 200)

        self.assertEqual(client.cookies["access"].value, "")
        self.assertEqual(client.cookies["refresh"].value, "")

    def testRefresh(self):
        client = Client()
        user = User(username="Test")
        user.set_password("Test")
        user.save()
        response = client.post("/api/token/", {"username": "Test", "password": "Test"})
        access_token = response.cookies["access"]
        refresh_token = response.cookies["refresh"]
        client.cookies["access"] = access_token.value
        client.cookies["refresh"] = refresh_token.value

        self.assertNotEqual(client.cookies["access"].value, "")
        response = client.post("/api/token/refresh/")
        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertEqual(response.status_code, 200)

        response = client.post("/api/token/refresh/", {"something": "something"})
        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertEqual(response.status_code, 200)

        client.cookies["access"] = ""
        self.assertEqual(client.cookies["access"].value, "")
        response = client.get("/api/history/")
        self.assertEqual(response.status_code, 401)

        response = client.post("/api/token/refresh/")
        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertEqual(response.status_code, 200)

        response = client.get("/api/history/")
        self.assertEqual(response.status_code, 200)

    def testRefreshWrongCookies(self):
        client = Client()
        user = User(username="Test")
        user.set_password("Test")
        user.save()
        response = client.post("/api/token/", {"username": "Test", "password": "Test"})
        access_token = response.cookies["access"]
        refresh_token = response.cookies["refresh"]
        client.cookies["access"] = access_token.value
        client.cookies["refresh"] = refresh_token.value

        self.assertNotEqual(client.cookies["access"].value, "")
        response = client.post("/api/token/refresh/")
        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertEqual(response.status_code, 200)

        client.cookies["access"] = ""

        response = client.post("/api/token/refresh/")
        self.assertNotEqual(client.cookies["access"].value, "")
        self.assertEqual(response.status_code, 200)

        client.cookies["access"] = ""
        client.cookies["refresh"] = "wrongCookies"
        response = client.post("/api/token/refresh/")
        self.assertEqual(client.cookies["access"].value, "")
        expected_data = {
            "refreshed": False,
            "reason": "{'detail': ErrorDetail(string='Token is invalid or expired', code='token_not_valid'), 'code': ErrorDetail(string='token_not_valid', code='token_not_valid')}",
        }
        self.assertEqual(response.data, expected_data)
        self.assertEqual(response.status_code, 400)


class apiTokenTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        self.path = "/api/token/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testbadCredentials(self):

        response = self.client.post(
            "/api/token/", {"username": "Test3", "password": "Test"}
        )
        self.assertFalse(response.data["success"])
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "success": False,
            "reason": "No active account found with the given credentials",
        }
        self.assertEqual(response.data, expected_data)

        response = self.client.post("/api/token/", {"password": "Test"})
        self.assertFalse(response.data["success"])
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "success": False,
            "reason": "{'username': [ErrorDetail(string='This field is required.', code='required')]}",
        }
        self.assertEqual(response.data, expected_data)

        response = self.client.post("/api/token/", {"username": "Test"})
        self.assertFalse(response.data["success"])
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "success": False,
            "reason": "{'password': [ErrorDetail(string='This field is required.', code='required')]}",
        }
        self.assertEqual(response.data, expected_data)

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        self.assertTrue(response.data["success"])
        self.assertEqual(response.status_code, 200)

        response = self.client.post(
            "/api/token/",
            {"username": "Test", "password": "Test", "something": "something"},
        )
        self.assertTrue(response.data["success"])
        self.assertEqual(response.status_code, 200)

        response = self.client.post("/api/token/")
        self.assertFalse(response.data["success"])
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "success": False,
            "reason": "{'username': [ErrorDetail(string='This field is required.', code='required')], 'password': [ErrorDetail(string='This field is required.', code='required')]}",
        }
        self.assertEqual(response.data, expected_data)


class apiLogoutTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        # access_token = response.cookies["access"]
        # refresh_token = response.cookies["refresh"]
        # self.client.cookies["access"] = access_token.value
        # self.client.cookies["refresh"] = refresh_token.value
        self.path = "/api/logout/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        # access_token = response.cookies["access"]
        # refresh_token = response.cookies["refresh"]
        # self.client.cookies["access"] = access_token.value
        # self.client.cookies["refresh"] = refresh_token.value

        response = self.client.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        # access_token = response.cookies["access"]
        # refresh_token = response.cookies["refresh"]
        # self.client.cookies["access"] = access_token.value
        # self.client.cookies["refresh"] = refresh_token.value

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.post("/api/logout/")
        self.assertEqual(response.status_code, 401)

        response = self.client.post("/api/logout/")
        self.assertNotEqual(response.status_code, 401)

    def testLogout(self):
        self.assertNotEqual(self.client.cookies["access"].value, "")
        self.assertNotEqual(self.client.cookies["refresh"].value, "")

        response = self.client.post("/api/logout/")
        self.assertEqual(response.status_code, 200)

        self.assertEqual(self.client.cookies["access"].value, "")
        self.assertEqual(self.client.cookies["refresh"].value, "")

    def testFakeData(self):
        self.assertNotEqual(self.client.cookies["access"].value, "")
        self.assertNotEqual(self.client.cookies["refresh"].value, "")

        response = self.client.post("/api/logout/", {"something": "something"})
        self.assertEqual(response.status_code, 200)

        self.assertEqual(self.client.cookies["access"].value, "")
        self.assertEqual(self.client.cookies["refresh"].value, "")


class changePasswordTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        # access_token = response.cookies["access"]
        # refresh_token = response.cookies["refresh"]
        # self.client.cookies["access"] = access_token.value
        # self.client.cookies["refresh"] = refresh_token.value
        self.path = "/api/changePassword/1/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.put(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.put(self.path)
        self.assertEqual(response.status_code, 401)

        response = self.client.put(self.path)
        self.assertNotEqual(response.status_code, 401)

    def testContenteType(self):

        response = self.client.put(self.path, {"new_password": "new_password"})
        self.assertEqual(response.status_code, 415)

        response = self.client.put(
            self.path,
            data=json.dumps({"new_password": "new_password"}),
            content_type="application/json",
        )
        self.assertNotEqual(response.status_code, 415)

    def testChangePassword(self):

        response = self.client.put(
            self.path,
            data=json.dumps({"new_password": "new_password"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(self.client.cookies["access"].value, "")
        self.assertEqual(self.client.cookies["refresh"].value, "")

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "success": False,
            "reason": "No active account found with the given credentials",
        }
        self.assertEqual(response.data, expected_data)

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "new_password"}
        )
        self.assertEqual(response.status_code, 200)

    def testbadRequests(self):
        response = self.client.put(
            self.path,
            data=json.dumps({"new_passord": "new_password"}),
            content_type="application/json",
        )
        expected_data = {"success": False, "reason": "No new password field"}
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, expected_data)

        response = self.client.put(
            self.path,
            data=json.dumps({"new_password": "Test"}),
            content_type="application/json",
        )
        expected_data = {"success": False, "reason": "Password is the same"}
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, expected_data)

        response = self.client.put(
            self.path,
            data=json.dumps({"new_password": "new_password", "something": "something"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)


class createUserTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )

        self.clientAdmin = Client()
        self.admin = User.objects.create_superuser(username="Admin", password="Admin")
        response = self.clientAdmin.post(
            "/api/token/", {"username": "Admin", "password": "Admin"}
        )
        self.path = "/api/createUser/"

    def testHTTPMethods(self):
        response = self.clientAdmin.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.clientAdmin.post(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.clientAdmin.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.clientAdmin.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.post(self.path)
        self.assertEqual(response.status_code, 401)

        response = self.client.post(self.path)
        self.assertEqual(response.status_code, 403)

        response = self.clientAdmin.post(self.path)
        self.assertNotEqual(response.status_code, 403)

    def testContenteType(self):

        response = self.clientAdmin.post(self.path, {"new_password": "new_password"})
        self.assertNotEqual(response.status_code, 415)

        response = self.clientAdmin.post(
            self.path, {"new_password": "new_password"}, content_type="application/json"
        )
        self.assertNotEqual(response.status_code, 415)

        response = self.clientAdmin.post(
            self.path,
            {"new_password": "new_password"},
            content_type="application/octet-stream",
        )
        self.assertEqual(response.status_code, 415)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def testCreatingUser(self):

        data = {
            "username": "Test2",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@example.pl",
            "PESEL": "11100099912",
        }
        response = self.clientAdmin.post(self.path, data=data)
        id = response.data
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.all().count(), 3)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Twoje konto zostało utworzone")
        self.assertIn("example@example.pl", mail.outbox[0].to)
        self.assertEqual(mail.outbox[0].from_email, "miloszwojtaszczyk99@gmail.com")
        self.assertEqual(len(mail.outbox[0].attachments), 1)
        attachment_name, attachment_content, attachment_mime = mail.outbox[
            0
        ].attachments[0]
        self.assertEqual(attachment_name, "password_in_zip.zip")
        self.assertEqual(attachment_mime, "application/zip")

        not_exists = os.path.exists("password.txt")
        self.assertFalse(not_exists)

        not_exists = os.path.exists("password_in_zip.zip")
        self.assertFalse(not_exists)

        us = User.objects.get(id=id)
        self.assertEqual(us.id, id)
        self.assertEqual(us.first_name, data["first_name"])
        self.assertEqual(us.last_name, data["last_name"])
        self.assertEqual(us.email, data["email"])
        self.assertEqual(us.username, data["username"])

    def testBadData(self):

        data = {
            "username": "Test",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@example.pl",
            "PESEL": "11100099912",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'username': [ErrorDetail(string='A user with that username already exists.', code='unique')]}"
        }
        self.assertEqual(response.data, expected_data)

        data = {
            "username": "Tes5t",
            "first_name": "Test",
            "last_name": "Test",
            "email": "exampleexamplepl",
            "PESEL": "11100099912",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'email': [ErrorDetail(string='Enter a valid email address.', code='invalid')]}"
        }
        self.assertEqual(response.data, expected_data)

        data = {
            "username": "Tes5t",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@examplepl",
            "PESEL": "11100099912",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'email': [ErrorDetail(string='Enter a valid email address.', code='invalid')]}"
        }
        self.assertEqual(response.data, expected_data)

        data = {
            "username": "Tes5t",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@example.pl",
            "PESEL": "111000999d2",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"
        }
        self.assertEqual(response.data, expected_data)

        data = {
            "username": "Tes5t",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@example.pl",
            "PESEL": "1110009992",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"
        }
        self.assertEqual(response.data, expected_data)

        data = {
            "username": "Tes5t",
            "first_name": "Test",
            "last_name": "Test",
            "email": "example@example.pl",
            "PESEL": "111030099972",
        }
        response = self.clientAdmin.post(self.path, data=data)
        self.assertEqual(response.status_code, 400)
        expected_data = {
            "reason": "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"
        }
        self.assertEqual(response.data, expected_data)


class singleImageTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        self.path = "/api/singleImageClassification/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.post(self.path)
        self.assertEqual(response.status_code, 401)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 403)

    def testSingleImage(self):

        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        best = new_model.id

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertGreaterEqual(Decimal(response.data["no_tumor_prob"]), 0)
        self.assertLessEqual(Decimal(response.data["no_tumor_prob"]), 1)

        self.assertGreaterEqual(Decimal(response.data["pituitary_prob"]), 0)
        self.assertLessEqual(Decimal(response.data["pituitary_prob"]), 1)

        self.assertGreaterEqual(Decimal(response.data["meningioma_prob"]), 0)
        self.assertLessEqual(Decimal(response.data["meningioma_prob"]), 1)

        self.assertGreaterEqual(Decimal(response.data["glioma_prob"]), 0)
        self.assertLessEqual(Decimal(response.data["glioma_prob"]), 1)

        self.assertEqual(response.data["image"]["patient"]["first_name"], "Test")
        self.assertEqual(response.data["image"]["patient"]["last_name"], "Test")
        self.assertEqual(response.data["image"]["patient"]["email"], "email@email.com")
        self.assertEqual(response.data["image"]["patient"]["PESEL"], "88888888888")

        self.assertTrue(response.data["image"]["id"] is not None)
        self.assertEqual(response.data["image"]["tumor_type"], None)
        self.assertEqual(
            response.data["image"]["hash"],
            "a1b2d37fbe15b486ab7ed24d220b80cf99f651dc940a8e7db849270e3d891d4e",
        )
        self.assertTrue(response.data["image"]["classified_by"] is None)
        self.assertEqual(
            response.data["image"]["photo"], "/media/Images/test_image.jpg"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Image.objects.all().count(), 1)
        self.assertEqual(Usage.objects.all().count(), 1)
        self.assertEqual(Classification.objects.all().count(), 1)
        self.assertEqual(Classification.objects.all().last().ml_model.id, best)

        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model2.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.96, pytorch_model=uploaded_file, name="Model_02")
        new_model.save()
        best = new_model.id
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model3.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.92, pytorch_model=uploaded_file, name="Model_03")
        new_model.save()

        patient_data["id"] = Patient.objects.all().last().id
        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Image.objects.all().count(), 1)
        self.assertEqual(Usage.objects.all().count(), 2)
        self.assertEqual(Classification.objects.all().count(), 2)
        self.assertEqual(Classification.objects.all().last().ml_model.id, best)

        path = "testFiles/Testcopy.jpg"
        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Image.objects.all().count(), 1)
        self.assertEqual(Usage.objects.all().count(), 3)
        self.assertEqual(Classification.objects.all().count(), 3)
        self.assertEqual(Classification.objects.all().last().ml_model.id, best)

        path = "testFiles/Test2.jpg"
        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image2.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Image.objects.all().count(), 2)
        self.assertEqual(Usage.objects.all().count(), 4)
        self.assertEqual(Classification.objects.all().count(), 4)

        os.remove("media/Images/test_image.jpg")
        os.remove("media/Images/test_image2.jpg")
        os.remove("media/MlModels/model.pth")
        os.remove("media/MlModels/model2.pth")
        os.remove("media/MlModels/model3.pth")
        Classification.objects.all().delete()
        Usage.objects.all().delete()
        Image.objects.all().delete()
        Patient.objects.all().delete()
        MlModel.objects.all().delete()

    def testNewPatientExistingFile(self):

        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image2.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test2",
            "last_name": "Test2",
            "email": "emai2@email.com",
            "PESEL": "88888887888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data, {"error": "Exact imaage exists and its different patient"}
        )
        self.assertEqual(Patient.objects.all().count(), 1)
        self.assertEqual(Image.objects.all().count(), 1)
        self.assertEqual(Usage.objects.all().count(), 1)
        self.assertEqual(Classification.objects.all().count(), 1)

        os.remove("media/MlModels/model.pth")
        os.remove("media/Images/test_image.jpg")

        Classification.objects.all().delete()
        Usage.objects.all().delete()
        Image.objects.all().delete()
        Patient.objects.all().delete()
        MlModel.objects.all().delete()

    def testOldPatientExistingFile(self):

        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        path = "testFiles/Test2.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image2.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test2",
            "last_name": "Test2",
            "email": "emai2@email.com",
            "PESEL": "88888887888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )

        self.assertEqual(Patient.objects.all().count(), 2)

        patient_data["id"] = Patient.objects.all().first().id
        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image2.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data, {"error": "Exact imaage exists and its different patient"}
        )
        self.assertEqual(Patient.objects.all().count(), 2)
        self.assertEqual(Image.objects.all().count(), 2)
        self.assertEqual(Usage.objects.all().count(), 2)
        self.assertEqual(Classification.objects.all().count(), 2)

        os.remove("media/MlModels/model.pth")

        Classification.objects.all().delete()
        Usage.objects.all().delete()
        Image.objects.all().delete()
        Patient.objects.all().delete()
        MlModel.objects.all().delete()

    def testNoNetwork(self):

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data, {"reason": "No Network"})
        self.assertEqual(Patient.objects.all().count(), 0)
        self.assertEqual(Image.objects.all().count(), 0)
        self.assertEqual(Usage.objects.all().count(), 0)
        self.assertEqual(Classification.objects.all().count(), 0)

    def testBadData(self):
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "emailemail.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            self.path,
            data={"pho6to": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,'No photo key')

        response = self.client.post(
            self.path,
            data={"photo": uploaded_image,},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,'No patient key')


        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,{'error': "{'email': [ErrorDetail(string='Enter a valid email address.', code='invalid')]}"})

        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "8888888888",
        }
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,{'error': "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"})

        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "888888h8888",
        }
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,{'error': "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"})

        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "888888998888",
        }
        response = self.client.post(
            self.path,
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,{'error': "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]}"})

        MlModel.objects.all().delete()
        os.remove("media/MlModels/model.pth")


class HistoryTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.client2 = Client()

        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()

        self.user2 = User(username="Test2")
        self.user2.set_password("Test2")
        self.user2.save()

        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )

        response = self.client2.post(
            "/api/token/", {"username": "Test2", "password": "Test2"}
        )

        self.path = "/api/history/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.get(self.path)
        self.assertEqual(response.status_code, 401)

        response = self.client.get(self.path)
        self.assertNotEqual(response.status_code, 403)

    def testHistory(self):
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            '/api/singleImageClassification/',
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        path = "testFiles/Test2.jpg"
        patient_data['id'] = Patient.objects.all().last().id
        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image2.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client2.post(
            '/api/singleImageClassification/',
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        path = "testFiles/tsetst.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image3.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        response = self.client.post(
            '/api/singleImageClassification/',
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )

        response = self.client.get(self.path)
        self.assertEqual(len(response.data),2)
        self.assertEqual(response.data[0]['classifications'][0]['image']['photo'],'/media/Images/test_image.jpg')
        self.assertEqual(response.data[1]['classifications'][0]['image']['photo'],'/media/Images/test_image3.jpg')

        response = self.client2.get(self.path)
        self.assertEqual(len(response.data),1)
        self.assertEqual(response.data[0]['classifications'][0]['image']['photo'],'/media/Images/test_image2.jpg')

        Image.objects.all().delete()
        os.remove("media/MlModels/model.pth")


class Classify(TestCase):

    def setUp(self):
        self.client = Client()

        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        self.path = "/api/classify/"

    def testHTTPMethods(self):
        response = self.client.get(self.path+'1/')
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path+'1/')
        self.assertEqual(response.status_code, 405)

        response = self.client.put(self.path+'1/')
        self.assertNotEqual(response.status_code, 405)

        response = self.client.delete(self.path+'1/')
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.put(self.path+'1/')
        self.assertEqual(response.status_code, 401)

        response = self.client.put(self.path+'1/')
        self.assertNotEqual(response.status_code, 403)

    def testClassify(self):
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            '/api/singleImageClassification/',
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        image = Image.objects.all().last()
        self.assertEqual(image.tumor_type,None)
        im = image.id

        response = self.client.put(self.path +str(im)+'/',{'tumor_type':0},content_type='application/json')
        self.assertEqual(response.status_code,200)
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'0')

        image.tumor_type = None
        image.save()

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':1},content_type='application/json')
        self.assertEqual(response.status_code,200)
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'1')

        image.tumor_type = None
        image.save()

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':2},content_type='application/json')
        self.assertEqual(response.status_code,200)
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'2')

        image.tumor_type = None
        image.save()

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':3},content_type='application/json')
        self.assertEqual(response.status_code,200)
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'3')

        image.tumor_type = None
        image.save()

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':4},content_type='application/json')
        self.assertEqual(response.status_code,200)
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'4')

        Image.objects.all().delete()
        os.remove("media/MlModels/model.pth")

    def testBadRequests(self):
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path = "testFiles/Test.jpg"

        with open(path, "rb") as image_file:
            uploaded_image = SimpleUploadedFile(
                name="test_image.jpg",
                content=image_file.read(),
                content_type="image/jpeg",
            )
        patient_data = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
        }

        response = self.client.post(
            '/api/singleImageClassification/',
            data={"photo": uploaded_image, "patient": json.dumps(patient_data)},
        )
        image = Image.objects.all().last()
        self.assertEqual(image.tumor_type,None)
        im = image.id

        response = self.client.put(self.path+str(66)+'/',{'tumor_type':2},content_type='application/json')
        self.assertEqual(response.status_code,404)
        self.assertEqual(response.data,'No such file')
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,None)

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':2},content_type='application/json')
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'2')
        response = self.client.put(self.path+str(im)+'/',{'tumor_type':3},content_type='application/json')
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,'Tumor already classified')
        image.refresh_from_db()
        self.assertEqual(image.tumor_type,'2')

        image.tumor_type = None
        image.save()

        response = self.client.put(self.path+str(im)+'/',{'tumeor_type':3},content_type='application/json')
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,'No tumor type key')

        response = self.client.put(self.path+str(im)+'/',{'tumor_type':8},content_type='application/json')
        self.assertEqual(response.status_code,400)
        self.assertEqual(response.data,{'reason': '{\'tumor_type\': ["Value \'8\' is not a valid choice."]}'})


        Image.objects.all().delete()
        os.remove("media/MlModels/model.pth")


class multipleImagesTest(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User(username="Test")
        self.user.set_password("Test")
        self.user.save()
        response = self.client.post(
            "/api/token/", {"username": "Test", "password": "Test"}
        )
        self.path = "/api/checkMultipleFiles/"

    def testHTTPMethods(self):
        response = self.client.get(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 405)

        response = self.client.put(self.path)
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(self.path)
        self.assertEqual(response.status_code, 405)

    def testAuth(self):
        client2 = Client()

        response = client2.post(self.path)
        self.assertEqual(response.status_code, 401)

        response = self.client.post(self.path)
        self.assertNotEqual(response.status_code, 403)

    def testMultipleFiles(self):
        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path1 = "testFiles/Test.jpg"
        path2 = "testFiles/Test2.jpg"
        path3 = "testFiles/tsetst.jpg"
        u_im1 = createUploadImage(path1, 1)
        u_im2 = createUploadImage(path2, 2)
        u_im3 = createUploadImage(path3, 3)

        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
            "images": ["test_image1.jpg", "test_image3.jpg"],
        }

        patient_data2 = {
            "first_name": "Test2",
            "last_name": "Test2",
            "email": "emai2l@email.com",
            "PESEL": "88828888888",
            "images": ["test_image2.jpg"],
        }

        response = self.client.post(
            self.path,
            data={
                "photos": [u_im1, u_im2, u_im3],
                "patients": json.dumps([patient_data1, patient_data2]),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["classifications"]), 3)
        self.assertEqual(response.data["doctor"], self.user.id)
        self.assertIsNotNone(response.data["report"])

        self.assertGreaterEqual(
            Decimal(response.data["classifications"][0]["no_tumor_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][0]["no_tumor_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][0]["pituitary_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][0]["pituitary_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][0]["meningioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][0]["meningioma_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][0]["glioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][0]["glioma_prob"]), 1
        )

        self.assertGreaterEqual(
            Decimal(response.data["classifications"][1]["no_tumor_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][1]["no_tumor_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][1]["pituitary_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][1]["pituitary_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][1]["meningioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][1]["meningioma_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][1]["glioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][1]["glioma_prob"]), 1
        )

        self.assertGreaterEqual(
            Decimal(response.data["classifications"][2]["no_tumor_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][2]["no_tumor_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][2]["pituitary_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][2]["pituitary_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][2]["meningioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][2]["meningioma_prob"]), 1
        )
        self.assertGreaterEqual(
            Decimal(response.data["classifications"][2]["glioma_prob"]), 0
        )
        self.assertLessEqual(
            Decimal(response.data["classifications"][2]["glioma_prob"]), 1
        )

        self.assertIsNone(response.data["classifications"][0]["image"]["tumor_type"])
        self.assertIsNone(response.data["classifications"][0]["image"]["classified_by"])

        self.assertIsNone(response.data["classifications"][1]["image"]["tumor_type"])
        self.assertIsNone(response.data["classifications"][1]["image"]["classified_by"])

        self.assertIsNone(response.data["classifications"][2]["image"]["tumor_type"])
        self.assertIsNone(response.data["classifications"][2]["image"]["classified_by"])

        self.assertEqual(
            response.data["classifications"][0]["image"]["photo"],
            "/media/Images/test_image1.jpg",
        )
        self.assertEqual(
            response.data["classifications"][0]["image"]["hash"],
            "a1b2d37fbe15b486ab7ed24d220b80cf99f651dc940a8e7db849270e3d891d4e",
        )

        self.assertEqual(
            response.data["classifications"][1]["image"]["photo"],
            "/media/Images/test_image3.jpg",
        )
        self.assertEqual(
            response.data["classifications"][1]["image"]["hash"],
            "4d0b401a57ac1625defc4ef8d618d39614f3d916dbf8766e93abe42ff7fd7d53",
        )

        self.assertEqual(
            response.data["classifications"][2]["image"]["photo"],
            "/media/Images/test_image2.jpg",
        )
        self.assertEqual(
            response.data["classifications"][2]["image"]["hash"],
            "aac45c900d54f1667267a7bd081946cbacdab66c170dbd85d44dbfc77c4ece3f",
        )

        self.assertEqual(
            response.data["classifications"][0]["image"]["patient"]["first_name"],
            "Test",
        )
        self.assertEqual(
            response.data["classifications"][0]["image"]["patient"]["last_name"], "Test"
        )
        self.assertEqual(
            response.data["classifications"][0]["image"]["patient"]["email"],
            "email@email.com",
        )
        self.assertEqual(
            response.data["classifications"][0]["image"]["patient"]["PESEL"],
            "88888888888",
        )

        self.assertEqual(
            response.data["classifications"][1]["image"]["patient"]["first_name"],
            "Test",
        )
        self.assertEqual(
            response.data["classifications"][1]["image"]["patient"]["last_name"], "Test"
        )
        self.assertEqual(
            response.data["classifications"][1]["image"]["patient"]["email"],
            "email@email.com",
        )
        self.assertEqual(
            response.data["classifications"][1]["image"]["patient"]["PESEL"],
            "88888888888",
        )

        self.assertEqual(
            response.data["classifications"][2]["image"]["patient"]["first_name"],
            "Test2",
        )
        self.assertEqual(
            response.data["classifications"][2]["image"]["patient"]["last_name"],
            "Test2",
        )
        self.assertEqual(
            response.data["classifications"][2]["image"]["patient"]["email"],
            "emai2l@email.com",
        )
        self.assertEqual(
            response.data["classifications"][2]["image"]["patient"]["PESEL"],
            "88828888888",
        )

        self.assertEqual(Patient.objects.all().count(), 2)
        self.assertEqual(Image.objects.all().count(), 3)
        self.assertEqual(Classification.objects.all().count(), 3)
        self.assertEqual(Usage.objects.all().count(), 1)
        self.assertEqual(Report.objects.all().count(), 1)

        u_im1 = createUploadImage(path1, 1)
        u_im2 = createUploadImage(path2, 2)
        u_im3 = createUploadImage(path3, 3)

        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888888888",
            "images": ["test_image1.jpg", "test_image3.jpg"],
            "id": Patient.objects.all().first().id,
        }

        patient_data2 = {
            "first_name": "Test2",
            "last_name": "Test2",
            "email": "emai2l@email.com",
            "PESEL": "88828888888",
            "images": ["test_image2.jpg"],
            "id": Patient.objects.all().last().id,
        }

        response = self.client.post(
            self.path,
            data={
                "photos": [u_im1, u_im2, u_im3],
                "patients": json.dumps([patient_data1, patient_data2]),
            },
        )

        self.assertEqual(Patient.objects.all().count(), 2)
        self.assertEqual(Image.objects.all().count(), 3)
        self.assertEqual(Classification.objects.all().count(), 6)
        self.assertEqual(Usage.objects.all().count(), 2)
        self.assertEqual(Report.objects.all().count(), 2)

        Image.objects.all().delete()
        os.remove("media/MlModels/model.pth")
        Report.objects.all().delete()

    def testwrongData(self):
        response = self.client.post(
            self.path,
            data={},
        )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data, {"reason": "No Network"})

        with open("media/MlModels/custom_googlenet.pth", "rb") as model_file:
            uploaded_file = SimpleUploadedFile(
                name="model.pth",
                content=model_file.read(),
                content_type="application/octet-stream",
            )

        new_model = MlModel(accuracy=0.94, pytorch_model=uploaded_file, name="Model_01")
        new_model.save()

        path1 = "testFiles/Test.jpg"
        path2 = "testFiles/Test2.jpg"
        path3 = "testFiles/tsetst.jpg"
        u_im1 = createUploadImage(path1, 1)
        u_im2 = createUploadImage(path2, 2)
        u_im3 = createUploadImage(path3, 3)

        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "emailemail.com",
            "PESEL": "88888888888",
            "images": ["test_image1.jpg"],
        }

        patient_data2 = {
            "first_name": "Test2",
            "last_name": "Test2",
            "email": "emai2l@email.com",
            "PESEL": "88828888888",
            "images": ["test_image2.jpg"],
        }

        response = self.client.post(
            self.path,
            data={
                "phots": [u_im1, u_im2, u_im3],
                "patients": json.dumps([patient_data1, patient_data2]),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, "No photos key")

        response = self.client.post(
            self.path,
            data={
                "photos": [u_im1, u_im2, u_im3],
                "patints": json.dumps([patient_data1, patient_data2]),
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, "No patients key")

        response = self.client.post(
            self.path,
            data={"photos": [u_im1], "patients": json.dumps([patient_data1])},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {
                "error": "{'email': [ErrorDetail(string='Enter a valid email address.', code='invalid')]} for patient {'first_name': 'Test', 'last_name': 'Test', 'email': 'emailemail.com', 'PESEL': '88888888888', 'images': ['test_image1.jpg']}"
            },
        )
        
        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "8888888888",
            "images": ["test_image1.jpg"],
        }
        
        response = self.client.post(
            self.path,
            data={"photos": [u_im1], "patients": json.dumps([patient_data1])},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data,
            {
               'error': "{'PESEL': [ErrorDetail(string='PESEL musi zawierać dokładnie 11 cyfr.', code='invalid')]} for patient {'first_name': 'Test', 'last_name': 'Test', 'email': 'email@email.com', 'PESEL': '8888888888', 'images': ['test_image1.jpg']}"
            },
        )
        
        self.assertEqual(Patient.objects.all().count(),0)
        self.assertEqual(Image.objects.all().count(),0)
        self.assertEqual(Classification.objects.all().count(),0)
        self.assertEqual(Usage.objects.all().count(),0)
        self.assertEqual(Report.objects.all().count(),0)
        
        u_im1 = createUploadImage(path1, 1)
        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email@email.com",
            "PESEL": "88888885888",
            "images": ["test_image1.jpg"],
        }
        
        response = self.client.post(
            self.path,
            data={"photos": [u_im1], "patients": json.dumps([patient_data1])},
        )
        self.assertEqual(response.status_code,200)
        
        
        u_im1 = createUploadImage(path1, 1)
        u_im2 = createUploadImage(path2, 2)
        
        patient_data1 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "email2@email.com",
            "PESEL": "88880885888",
            "images": ["test_image2.jpg"],
            
        }
        patient_data2 = {
            "first_name": "Test",
            "last_name": "Test",
            "email": "emai2l@email.com",
            "PESEL": "88883885888",
            "images": ["test_image2.jpg"],
            "id":Patient.objects.all().first().id
        }
        response = self.client.post(
            self.path,
            data={"photos": [u_im2], "patients": json.dumps([patient_data1,patient_data2])},
        )
        
        self.assertEqual(response.data,{'error': 'Exact imaage exists and its different patient'})
        self.assertEqual(response.status_code,400)
        
        self.assertEqual(Patient.objects.all().count(),1)
        self.assertEqual(Image.objects.all().count(),1)
        self.assertEqual(Usage.objects.all().count(),1)
        self.assertEqual(Classification.objects.all().count(),1)
        self.assertEqual(Report.objects.all().count(),1)
        
        Image.objects.all().delete()
        os.remove("media/MlModels/model.pth")
        os.remove("media/Images/test_image2.jpg")
        Report.objects.all().delete()
