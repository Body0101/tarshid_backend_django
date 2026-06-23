from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_assigned_esps')
    search_fields = ('user__username', 'assigned_esps__mac_address', 'assigned_esps__alias')
    filter_horizontal = ('assigned_esps',)

    def get_assigned_esps(self, obj):
        return ", ".join([esp.alias or esp.mac_address for esp in obj.assigned_esps.all()])
    get_assigned_esps.short_description = 'Assigned ESPs'
