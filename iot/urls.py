"""
Tarshid IoT Building Management System
URL Configuration
Author: kenana mohamed
"""
from django.urls import path
from . import views

urlpatterns = [
    path('api/device/register/', views.register_device, name='register_device'),
    path('api/device/<str:mac_address>/config/', views.get_device_config, name='get_device_config'),
    path('api/device/all/', views.list_all_devices, name='list_all_devices'),
    path('api/device/my-devices/', views.user_dashboard_devices, name='user_devices'),
    path('api/device/manage/', views.manage_device_details_api, name='manage_device_details'),
    path('api/device/manage/<str:mac_address>/', views.manage_device_details_api, name='manage_device_details_by_mac'),
]
