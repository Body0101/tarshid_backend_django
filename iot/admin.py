from django.contrib import admin
from .models import Device, Relay

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('mac_address', 'name', 'floor', 'is_online', 'last_seen')

@admin.register(Relay)
class RelayAdmin(admin.ModelAdmin):
    list_display = ('device', 'name', 'pin_number', 'is_on')
