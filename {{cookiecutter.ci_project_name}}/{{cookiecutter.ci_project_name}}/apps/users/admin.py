from django.contrib.auth.admin import UserAdmin
from {{cookiecutter.ci_project_name}}.utils.admin import register

from . import models

@register(models.User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "email",
        "is_superuser",
        "is_staff",
        "date_joined",
        "last_login",
    ]
    search_fields = ["username", "email"]
    list_filter = [
        "is_staff",
    ]
