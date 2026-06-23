"""
Tarshid IoT Building Management System
Database Models Configuration
Author: kenana mohamed
"""
from django.db import models

class ESPDevice(models.Model):
    DEVICE_TYPES = [
        ('USER', 'General User / Student'),
        ('ADMIN', 'Admin Only'),
    ]
    
    mac_address = models.CharField(max_length=17, primary_key=True, unique=True, help_text="Format: AA:BB:CC:DD:EE:FF")
    alias = models.CharField(max_length=100, help_text="Alias for the ESP (e.g., First Floor ESP)")
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPES, default='USER')
    
    floor = models.IntegerField(default=0, help_text="Floor number (0 for Ground, 1 for First...)")
    location = models.CharField(max_length=100, blank=True, null=True, help_text="Exact location (e.g., Hall A, Lab 3)")
    
    is_online = models.BooleanField(default=False)
    connected_at = models.DateTimeField(blank=True, null=True, help_text="Timestamp of last connection")
    disconnected_at = models.DateTimeField(blank=True, null=True, help_text="Timestamp of disconnection")

    class Meta:
        verbose_name = "ESP Device"
        verbose_name_plural = "ESP Devices"

    def __str__(self):
        return f"{self.alias} ({self.mac_address}) - Floor {self.floor}"


class Relay(models.Model):
    MODE_CHOICES = [
        ('MANUAL', 'Manual'),
        ('AUTO', 'Auto'),
        ('TIMER', 'Timer'),
    ]
    STATE_CHOICES = [
        ('ON', 'On'),
        ('OFF', 'Off'),
    ]
    
    esp = models.ForeignKey(ESPDevice, on_delete=models.CASCADE, related_name='relays')
    alias = models.CharField(max_length=100, help_text="Relay alias (e.g., Right Wing Lights)")
    pin_number = models.IntegerField(help_text="Physical GPIO Pin number connected to the relay")
    
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='MANUAL')
    state = models.CharField(max_length=3, choices=STATE_CHOICES, default='OFF')

    class Meta:
        verbose_name = "Relay"
        verbose_name_plural = "Relays"
        unique_together = ('esp', 'pin_number')

    def __str__(self):
        return f"{self.alias} (Pin {self.pin_number}) on {self.esp.alias}"


class PIRSensor(models.Model):
    esp = models.ForeignKey(ESPDevice, on_delete=models.CASCADE, related_name='pir_sensors')
    alias = models.CharField(max_length=100, help_text="Sensor alias (e.g., Corridor Motion Sensor)")
    pin_number = models.IntegerField(help_text="Physical GPIO Pin number connected to the PIR")
    
    last_triggered_at = models.DateTimeField(blank=True, null=True, help_text="Last time motion was detected")
    
    linked_relay = models.ForeignKey(
        Relay, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True, 
        related_name='linked_pirs',
        help_text="The relay to trigger automatically when motion is detected"
    )

    class Meta:
        verbose_name = "PIR Sensor"
        verbose_name_plural = "PIR Sensors"
        unique_together = ('esp', 'pin_number')

    def __str__(self):
        return f"{self.alias} (Pin {self.pin_number}) on {self.esp.alias}"
