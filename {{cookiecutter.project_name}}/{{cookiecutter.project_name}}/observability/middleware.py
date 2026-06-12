import time

from django.conf import settings

from .metrics import http_request_duration_seconds, http_requests_total


class PrometheusMetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.TELEMETRY_METRICS_ENABLED:
            return self.get_response(request)

        start = time.perf_counter()
        response = self.get_response(request)
        elapsed = time.perf_counter() - start

        route = getattr(getattr(request, "resolver_match", None), "route", None) or request.path
        host = request.get_host().split(":", 1)[0]
        method = request.method.upper()
        status_code = str(response.status_code)

        http_requests_total.labels(
            host=host,
            method=method,
            route=route,
            status_code=status_code,
        ).inc()
        http_request_duration_seconds.labels(
            host=host,
            method=method,
            route=route,
        ).observe(elapsed)

        return response
