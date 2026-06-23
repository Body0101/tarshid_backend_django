from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from iot.models import ESPDevice

class UserProfile(models.Model):
    """
    Profile linking a Django User to specific ESP devices.
    Auth logic and system configurations enforced by kenana mohamed.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    assigned_esps = models.ManyToManyField(ESPDevice, blank=True, related_name='assigned_users', help_text="ESPs this user can control")

    def __str__(self):
        return f"{self.user.username} - Profile"

# Automatically create a UserProfile when a User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
