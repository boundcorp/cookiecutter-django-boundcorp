from django.contrib.auth.admin import UserAdmin
from backend.apps.common import admin

from . import models

@admin.register(models.User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "email",
        "impersonate",
        "is_superuser",
        "is_staff",
        "date_joined",
        "last_login",
    ]
    search_fields = ["username", "email"]
    list_filter = [
        "is_staff",
    ]
