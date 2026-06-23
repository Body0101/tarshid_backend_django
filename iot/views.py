from django.http import JsonResponse
from .models import Device

def get_device_config(request, mac_address):
    try:
        device = Device.objects.get(mac_address=mac_address)
    except Device.DoesNotExist:
        return JsonResponse({"error": "Device not found"}, status=404)

    relays_data = []
    for relay in device.relays.all():
        relays_data.append({
            "name": relay.name,
            "pin_number": relay.pin_number,
            "is_on": relay.is_on,
            "power_rating": relay.power_rating_watts,
        })

    data = {
        "mac_address": device.mac_address,
        "name": device.name,
        "floor": device.floor,
        "is_online": device.is_online,
        "relays": relays_data,
    }
    return JsonResponse(data)
