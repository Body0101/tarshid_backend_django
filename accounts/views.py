from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from iot.models import ESPDevice
from django.shortcuts import render
from django.conf import settings

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """ Authenticate user and return Token & Role """
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username,
            'is_admin': user.is_superuser
        }, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_user_view(request):
    """ Admin only: Create user and assign ESPs """
    username = request.data.get('username')
    password = request.data.get('password')
    is_admin = request.data.get('is_admin', False)
    assigned_macs = request.data.get('assigned_esps', []) # List of MAC addresses
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Create the user
    new_user = User.objects.create_user(username=username, password=password)
    new_user.is_superuser = is_admin
    new_user.is_staff = is_admin
    new_user.save()
    
    # Assign ESPs
    if not is_admin and assigned_macs:
        # Admins don't need specific assignments, they see everything. Users do.
        esps = ESPDevice.objects.filter(mac_address__in=assigned_macs)
        new_user.profile.assigned_esps.set(esps)
        
    return Response({
        'status': 'success',
        'message': f'User {username} created successfully.',
        'assigned_esps_count': new_user.profile.assigned_esps.count()
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_with_secret_api(request):
    """ Public registration: Allow users to create standard accounts if they have the secret """
    username = request.data.get('username')
    password = request.data.get('password')
    secret_code = request.data.get('secret_code')

    if not username or not password or not secret_code:
        return Response({'error': 'Username, password, and secret code are required'}, status=status.HTTP_400_BAD_REQUEST)

    if secret_code != settings.REGISTRATION_SECRET:
        return Response({'error': 'Forbidden: Invalid registration secret code'}, status=status.HTTP_403_FORBIDDEN)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    # Create standard user
    new_user = User.objects.create_user(username=username, password=password)
    new_user.is_superuser = False
    new_user.is_staff = False
    new_user.save()

    return Response({
        'status': 'success',
        'message': f'User {username} registered successfully.'
    }, status=status.HTTP_201_CREATED)


def login_page(request):
    return render(request, 'accounts/login.html')

def admin_page(request):
    return render(request, 'accounts/admin.html')

def dashboard_page(request):
    return render(request, 'accounts/dashboard.html')

def register_page(request):
    return render(request, 'accounts/register.html')
