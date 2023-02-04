import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "{{cookiecutter.ci_project_name}}.settings")

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
