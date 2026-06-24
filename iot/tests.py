from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from iot.models import ESPDevice

class ListAllDevicesTests(APITestCase):
    def setUp(self):
        # Create a test ESP Device
        self.device = ESPDevice.objects.create(
            mac_address="AA:BB:CC:DD:EE:FF",
            alias="Test ESP",
            floor=1,
            location="Room 101",
            is_online=True
        )
        self.url = reverse('list_all_devices')

    def test_unauthenticated_user_cannot_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_access(self):
        user = User.objects.create_user(username="regular_user", password="password123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_not_staff_can_access(self):
        user = User.objects.create_user(username="superuser_only", password="password123")
        user.is_superuser = True
        user.is_staff = False
        user.save()
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['mac_address'], "AA:BB:CC:DD:EE:FF")

    def test_staff_not_superuser_can_access(self):
        user = User.objects.create_user(username="staff_only", password="password123")
        user.is_superuser = False
        user.is_staff = True
        user.save()
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_and_staff_can_access(self):
        user = User.objects.create_user(username="superuser_and_staff", password="password123")
        user.is_superuser = True
        user.is_staff = True
        user.save()
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
