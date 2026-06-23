from django.http import JsonResponse
from .models import ESPDevice

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
