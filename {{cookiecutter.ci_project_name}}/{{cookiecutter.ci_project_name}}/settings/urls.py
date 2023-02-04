# -*- coding: utf-8 -*-
from django.conf import settings
from django.conf.urls import include
from django.conf.urls.static import static
from django.urls import path, re_path
from graphene_django.views import GraphQLView
from rest_framework.routers import DefaultRouter

from {{cookiecutter.ci_project_name}}.utils.admin import admin_site
from {{cookiecutter.ci_project_name}}.utils.views import healthz

# Unused
api_router = DefaultRouter(trailing_slash=True)
api_router.include_root_view = settings.DEBUG
api_router.include_format_suffixes = False

urlpatterns = [
    path("api/", include(api_router.urls)),
    path("mgmt/", admin_site.urls),
    path("healthz/", healthz),
    path(
        "api/graphql/",
        GraphQLView.as_view(
            graphiql=True,
        ),
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)