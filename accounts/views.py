from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from iot.models import ESPDevice

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
