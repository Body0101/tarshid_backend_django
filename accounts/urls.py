from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='api_login'),
    path('create_user/', views.create_user_view, name='api_create_user'),
]
