from django.urls import path
from . import views

urlpatterns = [
    path('api/device/register/', views.register_device, name='register_device'),
    path('api/device/<str:mac_address>/config/', views.get_device_config, name='get_device_config'),
]
