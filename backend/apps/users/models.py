from django.contrib.auth.models import AbstractUser
from django.db import models

from backend.apps.utils.models import TimestampMixin, UUIDMixin

class User(TimestampMixin, UUIDMixin, AbstractUser):
    EMAIL_FIELD = "email__iexact"


    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

