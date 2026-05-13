from django.conf import settings
from prometheus_client import Counter, Histogram

METRIC_PREFIX = settings.TELEMETRY_NAMESPACE

http_requests_total = Counter(
    f"{METRIC_PREFIX}_http_requests_total",
    "Total HTTP requests handled by Django.",
    labelnames=("host", "method", "route", "status_code"),
)

http_request_duration_seconds = Histogram(
    f"{METRIC_PREFIX}_http_request_duration_seconds",
    "HTTP request latency in seconds.",
    labelnames=("host", "method", "route"),
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float("inf")),
)

celery_task_started_total = Counter(
    f"{METRIC_PREFIX}_celery_task_started_total",
    "Total Celery tasks started.",
    labelnames=("task_name",),
)

celery_task_succeeded_total = Counter(
    f"{METRIC_PREFIX}_celery_task_succeeded_total",
    "Total Celery tasks completed successfully.",
    labelnames=("task_name",),
)

celery_task_failures_total = Counter(
    f"{METRIC_PREFIX}_celery_task_failures_total",
    "Total Celery tasks that raised an exception.",
    labelnames=("task_name",),
)

celery_task_latency_seconds = Histogram(
    f"{METRIC_PREFIX}_celery_task_latency_seconds",
    "Celery task runtime in seconds.",
    labelnames=("task_name",),
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, float("inf")),
)
