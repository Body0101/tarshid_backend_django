from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints
    path('login/', views.login_view, name='api_login'),
    path('create_user/', views.create_user_view, name='api_create_user'),
    
    # HTML Pages
    path('', views.login_page, name='login_page'),
    path('admin-panel/', views.admin_page, name='admin_page'),
    path('dashboard/', views.dashboard_page, name='dashboard_page'),
]
