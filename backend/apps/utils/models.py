import logging
import uuid

from django.db import models

log = logging.getLogger("backend")


def _generate_id():
    return "".join(str(uuid.uuid4()).split("-")[1:3])


def _generate_medium_id():
    return "".join(str(uuid.uuid4()).split("-")[1:4])


class ShortIdMixin(models.Model):
    id = models.CharField(max_length=32, primary_key=True, default=_generate_id, editable=False)

    class Meta:
        abstract = True


class MediumIDMixin(models.Model):
    id = models.CharField(max_length=32, primary_key=True, default=_generate_id, editable=False)

    class Meta:
        abstract = True


class UUIDMixin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        abstract = True
        ordering = ("-updated_at", "-created_at")


def from_choices(c):
    return {"choices": c.choices, "max_length": max([len(x) for x in c]), "default": c.choices[0]}


def format_cents(c):
    return "${:0.2f}".format(c / 100)


def get_client_ip(META):
    x_forwarded_for = META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = META.get("REMOTE_ADDR")
    return ip


def uuid4_string():
    return str(uuid.uuid4())
