"""
Tarshid IoT Building Management System
URL Configuration
Author: Abdulrahman Saber
"""
from django.urls import path
from . import views

urlpatterns = [
    path('api/device/register/', views.register_device, name='register_device'),
    path('api/device/<str:mac_address>/config/', views.get_device_config, name='get_device_config'),
    path('api/device/all/', views.list_all_devices, name='list_all_devices'),
    path('api/device/my-devices/', views.user_dashboard_devices, name='user_devices'),
]
