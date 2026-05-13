from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest


def metrics_view(request):
    if not settings.TELEMETRY_METRICS_ENABLED:
        return HttpResponseNotFound("Telemetry disabled.")
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
