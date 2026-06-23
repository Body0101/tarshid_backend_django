"""
Tarshid IoT Building Management System
Auto-Discovery API Views
Author: kenana mohamed
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ESPDevice, Relay, PIRSensor

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
            
            if not mac:
                return JsonResponse({"error": "MAC address is required"}, status=400)

            # 1. Update or Create the ESP Device
            esp, created = ESPDevice.objects.update_or_create(
                mac_address=mac,
                defaults={'alias': esp_alias, 'is_online': True}
            )

            # 2. Process Relays
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

            # 3. Process PIR Sensors
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
