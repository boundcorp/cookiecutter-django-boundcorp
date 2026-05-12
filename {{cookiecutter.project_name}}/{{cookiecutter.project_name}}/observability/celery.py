import time

from celery.signals import task_failure, task_postrun, task_prerun

from .metrics import (
    celery_task_failures_total,
    celery_task_latency_seconds,
    celery_task_started_total,
    celery_task_succeeded_total,
)

_TASK_START_TIMES = {}


def _task_name(task):
    return getattr(task, "name", None) or "unknown"


@task_prerun.connect
def record_task_start(task_id=None, task=None, **kwargs):
    task_name = _task_name(task)
    _TASK_START_TIMES[task_id] = time.perf_counter()
    celery_task_started_total.labels(task_name=task_name).inc()


@task_postrun.connect
def record_task_completion(task_id=None, task=None, state=None, **kwargs):
    task_name = _task_name(task)
    started_at = _TASK_START_TIMES.pop(task_id, None)
    if started_at is not None:
        celery_task_latency_seconds.labels(task_name=task_name).observe(time.perf_counter() - started_at)
    if state == "SUCCESS":
        celery_task_succeeded_total.labels(task_name=task_name).inc()


@task_failure.connect
def record_task_failure(task_id=None, sender=None, **kwargs):
    task_name = _task_name(sender)
    celery_task_failures_total.labels(task_name=task_name).inc()
