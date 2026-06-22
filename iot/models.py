from django.db import models

class Device(models.Model):
    mac_address = models.CharField(max_length=17, primary_key=True)
    name = models.CharField(max_length=100)
    floor = models.IntegerField(default=1)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Relay(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='relays')
    name = models.CharField(max_length=100)
    pin_number = models.IntegerField()
    is_on = models.BooleanField(default=False)
    power_rating_watts = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.device.name} - {self.name}"
