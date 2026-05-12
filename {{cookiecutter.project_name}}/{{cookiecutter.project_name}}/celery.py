import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "{{cookiecutter.project_name}}.settings")

app = Celery("{{cookiecutter.project_name}}")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

import {{cookiecutter.project_name}}.observability.celery  # noqa: E402,F401
