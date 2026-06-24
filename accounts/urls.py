"""
Tarshid IoT Building Management System
Accounts App URL Configuration
Author: kenana mohamed
"""
from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints
    path('login/', views.login_view, name='api_login'),
    path('create_user/', views.create_user_view, name='api_create_user'),
    path('register_api/', views.register_with_secret_api, name='api_register_with_secret'),
    
    # HTML Pages
    path('', views.login_page, name='login_page'),
    path('admin-panel/', views.admin_page, name='admin_page'),
    path('devices/', views.devices_page, name='devices_page'),
    path('dashboard/', views.dashboard_page, name='dashboard_page'),
    path('register/', views.register_page, name='register_page'),
]
