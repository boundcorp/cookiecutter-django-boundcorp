from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from {{cookiecutter.project_name}}.utils.admin import admin_site
from {{cookiecutter.project_name}}.api import api
from {{cookiecutter.project_name}}.observability.views import metrics_view

urlpatterns = [
    path("api/", api.urls),
    path("mgmt/", admin_site.urls),
    path(f"{settings.TELEMETRY_METRICS_PATH}/", metrics_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
