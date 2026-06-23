"""
Tarshid IoT Building Management System
Admin Dashboard Configuration
Author: kenana mohamed
"""
from django.contrib import admin
from .models import ESPDevice, Relay, PIRSensor

@admin.register(ESPDevice)
class ESPDeviceAdmin(admin.ModelAdmin):
    list_display = ('mac_address', 'alias', 'floor', 'location', 'device_type', 'is_online')
    list_filter = ('floor', 'device_type', 'is_online')
    search_fields = ('mac_address', 'alias', 'location')
    readonly_fields = ('connected_at', 'disconnected_at')

@admin.register(Relay)
class RelayAdmin(admin.ModelAdmin):
    list_display = ('alias', 'esp', 'pin_number', 'mode', 'state')
    list_filter = ('mode', 'state', 'esp__floor')
    search_fields = ('alias', 'esp__mac_address', 'esp__alias')

@admin.register(PIRSensor)
class PIRSensorAdmin(admin.ModelAdmin):
    list_display = ('alias', 'esp', 'pin_number', 'linked_relay', 'last_triggered_at')
    list_filter = ('esp__floor',)
    search_fields = ('alias', 'esp__mac_address', 'esp__alias')
    readonly_fields = ('last_triggered_at',)
