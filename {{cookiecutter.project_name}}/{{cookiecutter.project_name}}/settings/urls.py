# -*- coding: utf-8 -*-
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from {{cookiecutter.project_name}}.utils.admin import admin_site

urlpatterns = [
    path("mgmt/", admin_site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
