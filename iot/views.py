"""
Tarshid IoT Building Management System
Auto-Discovery API Views
Author: kenana mohamed
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ESPDevice, Relay, PIRSensor
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

class IsSuperUserOrStaff(BasePermission):
    """
    Custom permission to allow access only to superusers or staff members.
    This resolves the authorization mismatch for admin endpoints.
    """
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_superuser or request.user.is_staff))

def get_device_config(request, mac_address):
    try:
        device = ESPDevice.objects.get(mac_address=mac_address)
    except ESPDevice.DoesNotExist:
        return JsonResponse({"error": "Device not found"}, status=404)

    relays_data = []
    for relay in device.relays.all():
        relays_data.append({
            "alias": relay.alias,
            "pin_number": relay.pin_number,
            "mode": relay.mode,
            "state": relay.state,
        })

    data = {
        "mac_address": device.mac_address,
        "alias": device.alias,
        "device_type": device.device_type,
        "floor": device.floor,
        "location": device.location,
        "is_online": device.is_online,
        "temperature": device.temperature,
        "relays": relays_data,
    }
    return JsonResponse(data)

@csrf_exempt
def register_device(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mac = data.get('mac_address')
            esp_alias = data.get('alias', 'New ESP Device')
            temperature = data.get('temperature')
            
            if not mac:
                return JsonResponse({"error": "MAC address is required"}, status=400)

            # Update or Create the ESP Device defaults
            defaults = {'alias': esp_alias, 'is_online': True}
            if temperature is not None:
                defaults['temperature'] = float(temperature)

            esp, created = ESPDevice.objects.update_or_create(
                mac_address=mac,
                defaults=defaults
            )

            # Process Relays
            relays_data = data.get('relays', [])
            for r_data in relays_data:
                Relay.objects.update_or_create(
                    esp=esp,
                    pin_number=r_data.get('pin'),
                    defaults={
                        'alias': r_data.get('alias', f'Relay {r_data.get("pin")}'),
                        'mode': r_data.get('mode', 'MANUAL'),
                        'state': r_data.get('state', 'OFF')
                    }
                )

            # Process PIR Sensors
            pir_data = data.get('sensors', [])
            for p_data in pir_data:
                PIRSensor.objects.update_or_create(
                    esp=esp,
                    pin_number=p_data.get('pin'),
                    defaults={
                        'alias': p_data.get('alias', f'PIR {p_data.get("pin")}'),
                    }
                )

            return JsonResponse({"status": "success", "message": "Device registered successfully", "created": created})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Only POST allowed"}, status=405)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperUserOrStaff])
def list_all_devices(request):
    """ Return all ESP devices grouped by floor for the admin map """
    devices = ESPDevice.objects.all().order_by('floor', 'alias')
    data = []
    for d in devices:
        data.append({
            'mac_address': d.mac_address,
            'alias': d.alias,
            'floor': d.floor,
            'location': d.location,
            'is_online': d.is_online,
            'temperature': d.temperature
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_devices(request):
    """ Return devices assigned to the user, and only relays that are ON """
    if request.user.is_superuser:
        devices = ESPDevice.objects.all().order_by('floor', 'alias')
    else:
        devices = request.user.profile.assigned_esps.all().order_by('floor', 'alias')
        
    data = []
    for d in devices:
        active_relays = d.relays.filter(state='ON')
        relays_data = [{'alias': r.alias, 'mode': r.mode} for r in active_relays]
        
        data.append({
            'mac_address': d.mac_address,
            'alias': d.alias,
            'is_online': d.is_online,
            'floor': d.floor,
            'location': d.location,
            'temperature': d.temperature,
            'active_relays': relays_data
        })
    return Response(data)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def manage_device_details_api(request, mac_address=None):
    """ Admin view to list all devices with details or update individual configs """
    if request.method == 'GET':
        devices = ESPDevice.objects.all().order_by('floor', 'alias')
        data = []
        for d in devices:
            relays_data = [{
                'id': r.id,
                'pin_number': r.pin_number,
                'alias': r.alias,
                'mode': r.mode,
                'state': r.state
            } for r in d.relays.all()]
            
            pir_data = [{
                'id': p.id,
                'pin_number': p.pin_number,
                'alias': p.alias
            } for p in d.pir_sensors.all()]
            
            data.append({
                'mac_address': d.mac_address,
                'alias': d.alias,
                'device_type': d.device_type,
                'floor': d.floor,
                'location': d.location,
                'temperature': d.temperature,
                'is_online': d.is_online,
                'relays': relays_data,
                'pir_sensors': pir_data
            })
        return Response(data)

    elif request.method == 'PUT':
        if not mac_address:
            return Response({'error': 'MAC address required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            device = ESPDevice.objects.get(mac_address=mac_address)
        except ESPDevice.DoesNotExist:
            return Response({'error': 'Device not found'}, status=status.HTTP_404_NOT_FOUND)
            
        alias = request.data.get('alias')
        floor = request.data.get('floor')
        location = request.data.get('location')
        relays = request.data.get('relays', [])
        sensors = request.data.get('sensors', [])
        
        if alias is not None:
            device.alias = alias
        if floor is not None:
            device.floor = int(floor)
        if location is not None:
            device.location = location
        device.save()
        
        # Update Relays
        for r_item in relays:
            r_id = r_item.get('id')
            r_alias = r_item.get('alias')
            if r_id and r_alias is not None:
                try:
                    relay = Relay.objects.get(id=r_id, esp=device)
                    relay.alias = r_alias
                    relay.save()
                except Relay.DoesNotExist:
                    pass
                    
        # Update PIR Sensors
        for s_item in sensors:
            s_id = s_item.get('id')
            s_alias = s_item.get('alias')
            if s_id and s_alias is not None:
                try:
                    sensor = PIRSensor.objects.get(id=s_id, esp=device)
                    sensor.alias = s_alias
                    sensor.save()
                except PIRSensor.DoesNotExist:
                    pass
                    
        return Response({'status': 'success', 'message': 'Device configuration updated successfully'})
