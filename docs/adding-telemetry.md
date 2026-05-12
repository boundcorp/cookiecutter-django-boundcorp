# Adding Telemetry to an Existing Cookiecutter App

This runbook upgrades an existing cookiecutter app to the current telemetry baseline:

1. App-owned Prometheus instrumentation in Django and Celery.
2. App-owned Grafana dashboard JSON in `docs/dashboards/`.
3. A repo-local GitHub Actions sync job that updates Grafana on `main`.
4. One shared, infra-owned "Django Apps" dashboard for fleet-wide comparisons.

## Target State

After the migration:

1. The app exposes `/metrics/`.
2. Prometheus scrapes the app and worker metrics with a stable metric prefix.
3. The repo contains `docs/dashboards/<app>-overview.json` and, if applicable, `docs/dashboards/<app>-workers.json`.
4. `.github/workflows/sync-grafana-dashboards.yml` upserts those dashboards on every push to `main`.
5. All repo-owned dashboards are `editable=false`, tagged `json-managed`, and refresh every `30s`.
6. The app also contributes to the shared Django Apps dashboard managed outside the app repo.

## Files to Backport

When migrating an older app, copy or recreate these files from the current cookiecutter baseline:

1. `{{project_name}}/observability/metrics.py`
2. `{{project_name}}/observability/middleware.py`
3. `{{project_name}}/observability/celery.py`
4. `{{project_name}}/observability/views.py`
5. `docs/dashboards/<app>-overview.json`
6. `docs/dashboards/<app>-workers.json`
7. `scripts/sync_grafana_dashboards.py`
8. `scripts/install_grafana_sa_secret.sh`
9. `.github/workflows/sync-grafana-dashboards.yml`

Also backport the related wiring changes:

1. Add `prometheus-client` to Python dependencies.
2. Add `PrometheusMetricsMiddleware` to `MIDDLEWARE`.
3. Add `path("metrics/", metrics_view)` to the root URLConf.
4. Import `observability.celery` from the app's Celery bootstrap module.

## Required Secrets and Variables

Each repo needs these GitHub secrets:

1. `GRAFANA_URL`
2. `GRAFANA_SA_TOKEN`
3. `GRAFANA_PROMETHEUS_DATASOURCE_UID`
4. `GRAFANA_FOLDER_UID` if you want a fixed target folder UID

The workflow also supports `GRAFANA_FOLDER_TITLE` as a fallback if you prefer letting the sync script create or find the folder by title.

## Step 1: Install Python dependency

Add `prometheus-client` to the app's Python dependencies. Example:

```toml
[tool.poetry.dependencies]
prometheus-client = "*"
```

Then refresh the lockfile or environment using the package manager already used by the repo.

## Step 2: Backport the instrumentation

Apply the template scaffolding and preserve the app's existing Sentry setup.

Create `{{project_name}}/observability/metrics.py` with counters and histograms for HTTP requests and Celery task execution:

```python
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
)
```

Create `{{project_name}}/observability/middleware.py` and add it near the top of `MIDDLEWARE`:

```python
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
```

Create `{{project_name}}/observability/views.py`:

```python
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest


def metrics_view(request):
    if not settings.TELEMETRY_METRICS_ENABLED:
        return HttpResponseNotFound("Telemetry disabled.")
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
```

Create `{{project_name}}/observability/celery.py` and import it from the app's Celery bootstrap module:

```python
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
```

The current baseline emits:

1. `{{project_name}}_http_requests_total`
2. `{{project_name}}_http_request_duration_seconds`
3. `{{project_name}}_celery_task_started_total`
4. `{{project_name}}_celery_task_succeeded_total`
5. `{{project_name}}_celery_task_failures_total`
6. `{{project_name}}_celery_task_latency_seconds`

The request metrics are labeled by `host`, `method`, `route`, and `status_code`, which is enough to power the shared Django Apps dashboard with per-domain GET and POST usage.

Add these settings if they are not already present:

```python
TELEMETRY_NAMESPACE = os.environ.get("TELEMETRY_NAMESPACE", "{{project_name}}").replace("-", "_")
TELEMETRY_METRICS_ENABLED = env_variable_truthy("TELEMETRY_METRICS_ENABLED", "true")
TELEMETRY_METRICS_PATH = os.environ.get("TELEMETRY_METRICS_PATH", "metrics").strip("/") or "metrics"
```

Mount the middleware and metrics endpoint:

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "{{project_name}}.observability.middleware.PrometheusMetricsMiddleware",
    # ...
]
```

```python
from django.conf import settings
from django.urls import path

from {{project_name}}.observability.views import metrics_view

urlpatterns = [
    path(f"{settings.TELEMETRY_METRICS_PATH}/", metrics_view),
]
```

Import the Celery signal module from the app bootstrap:

```python
import {{project_name}}.observability.celery  # noqa: E402,F401
```

## Step 3: Expose and scrape `/metrics/`

Confirm the app serves `/metrics/` from the Django process.

Quick local check:

```bash
python manage.py runserver
curl -sS http://127.0.0.1:8000/metrics/ | head
```

Then update the app's Kubernetes manifests or Helm values so Prometheus can scrape it. The exact mechanism can vary:

1. Pod annotations
2. A `ServiceMonitor`
3. An existing scrape job wired to the app's Service

Keep the scrape path consistent as `/metrics/` unless there is a hard reason not to.

## Step 4: Add repo-owned dashboards

Keep app-specific dashboards in the app repo. Use the template JSON as the starting point and adjust only the panels that are specific to that app.

Conventions:

1. `editable: false`
2. `tags` includes `json-managed`
3. `refresh: "30s"`
4. `timepicker.refresh_intervals` includes `10s`, `30s`, `1m`, `5m`, and `15m`
5. Use `__PROMETHEUS_DS_UID__` in the JSON and let the sync script replace it during CI
6. Give every dashboard a stable `uid`; use `<app>-overview` and `<app>-workers`
7. Tag overview dashboards with the app slug and tag worker dashboards with both the app slug and `workers`

The repo dashboards should answer "what is happening inside this app?" The shared infra-owned dashboard should answer "how do all Django apps compare?"

Seed these files:

1. `docs/dashboards/<app>-overview.json`
2. `docs/dashboards/<app>-workers.json`

The overview dashboard should include at least:

1. Requests by host and method
2. P95 request latency by route
3. Error responses by host and status code
4. Celery success and failure rates if the app has workers

The worker dashboard should include at least:

1. Task start rate by task name
2. P95 task runtime by task name
3. Success vs failure rate by task name

Minimal metadata example:

```json
{
  "title": "<app> Overview",
  "uid": "<app>-overview",
  "editable": false,
  "refresh": "30s",
  "tags": ["json-managed", "<app>"],
  "timepicker": {
    "refresh_intervals": ["10s", "30s", "1m", "5m", "15m"]
  }
}
```

## Step 5: Install the sync workflow

Add `.github/workflows/sync-grafana-dashboards.yml` and `scripts/sync_grafana_dashboards.py`.

The workflow:

1. Runs on `push` to `main`
2. Supports `workflow_dispatch`
3. Loads all `docs/dashboards/*.json`
4. Normalizes `editable`, `tags`, and `refresh`
5. Replaces `__PROMETHEUS_DS_UID__`
6. Upserts the dashboards through the Grafana HTTP API

This is intentionally separate from deploy so dashboard fixes can ship without a full app release.

Workflow example:

```yaml
name: Sync Grafana Dashboards

on:
  push:
    branches: [main]
    paths:
      - "docs/dashboards/*.json"
      - "scripts/sync_grafana_dashboards.py"
      - ".github/workflows/sync-grafana-dashboards.yml"
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: python -m pip install requests
      - env:
          GRAFANA_URL: ${{ secrets.GRAFANA_URL }}
          GRAFANA_SA_TOKEN: ${{ secrets.GRAFANA_SA_TOKEN }}
          GRAFANA_PROMETHEUS_DATASOURCE_UID: ${{ secrets.GRAFANA_PROMETHEUS_DATASOURCE_UID }}
          GRAFANA_FOLDER_UID: ${{ secrets.GRAFANA_FOLDER_UID }}
          GRAFANA_FOLDER_TITLE: ${{ vars.GRAFANA_FOLDER_TITLE || github.repository }}
        run: python scripts/sync_grafana_dashboards.py
```

The sync script should normalize `editable=false`, ensure the `json-managed` tag is present, force `refresh="30s"`, replace `__PROMETHEUS_DS_UID__`, and fail if a dashboard has no stable `uid`.

## Step 6: Seed the Grafana token

Steady state is one GitHub secret per repo: `GRAFANA_SA_TOKEN`.

Recommended bootstrap flow:

1. Store the Grafana dashboard-writer token in a Kubernetes Secret in the cluster used by the app fleet.
2. Use a one-time operator command to copy that token into each GitHub repo secret.
3. Let GitHub Actions read the repo secret directly on future runs.

The cookiecutter ships `scripts/install_grafana_sa_secret.sh` for this pattern. Example:

```bash
./scripts/install_grafana_sa_secret.sh grafana grafana-dashboard-writer token GRAFANA_SA_TOKEN boundcorp/cabal
```

That script effectively does:

```bash
kubectl get secret grafana-dashboard-writer -n grafana -o 'jsonpath={.data.token}' \
  | base64 --decode \
  | gh secret set GRAFANA_SA_TOKEN --repo boundcorp/cabal
```

Do not make CI fetch the token from Kubernetes on every run. Use Kubernetes only as the operator-side bootstrap source.

Also set the rest of the Grafana secrets:

```bash
gh secret set GRAFANA_URL --repo <org>/<repo>
gh secret set GRAFANA_PROMETHEUS_DATASOURCE_UID --repo <org>/<repo>
gh secret set GRAFANA_FOLDER_UID --repo <org>/<repo>
```

If you do not know the folder UID yet, omit `GRAFANA_FOLDER_UID` and let the workflow create or reuse a folder based on `GRAFANA_FOLDER_TITLE`.

By default the cookiecutter workflow uses `owner/repo` as `GRAFANA_FOLDER_TITLE`, which avoids collisions better than a bare repo name. If the desired Grafana folder name differs from the GitHub repo slug, set a repo variable instead of patching the workflow:

```bash
gh variable set GRAFANA_FOLDER_TITLE --repo <org>/<repo> --body "<grafana-folder-title>"
```

## Step 7: Shared fleet dashboard

Each app repo owns its own dashboards, but the fleet-wide "Django Apps" dashboard should still live in a shared infrastructure repo or equivalent shared provisioning layer.

That shared dashboard should graph cross-app queries using the standardized metrics:

1. GETs and POSTs per `host`
2. Error-rate by `host`
3. P95 request latency by `route`
4. Celery success and failure rates by app

Because every migrated app emits the same metric names and labels, the shared dashboard can be managed once in the shared infra layer while each repo keeps its own app-deep dashboards locally.

## Step 8: Validate

After the first push to `main`:

1. Hit the app a few times.
2. Confirm `/metrics/` returns Prometheus text output.
3. Confirm Prometheus ingests the new series.
4. Confirm the repo-owned dashboards appear in Grafana.
5. Confirm the shared Django Apps dashboard shows the app's traffic alongside the other apps.

Local generated-app validation checklist:

```bash
cookiecutter . --no-input \
  project_name=telemetrydemo \
  docker_image_url=ghcr.io/example/telemetrydemo \
  production_hostname=telemetrydemo.example.com \
  author="Telemetry Demo" \
  email=telemetry@example.com

cd telemetrydemo
test -f docs/dashboards/telemetrydemo-overview.json
test -f docs/dashboards/telemetrydemo-workers.json
python - <<'PY'
import json
from pathlib import Path

for path in (
    Path("docs/dashboards/telemetrydemo-overview.json"),
    Path("docs/dashboards/telemetrydemo-workers.json"),
):
    data = json.loads(path.read_text())
    assert data["editable"] is False
    assert data["refresh"] == "30s"
    assert "json-managed" in data["tags"]
    assert data["uid"]
print("dashboard metadata ok")
PY
env -u DATABASE_URL -u CELERY_BROKER_URL -u S3_ENDPOINT_URL .venv/bin/pytest telemetrydemo/api/tests/test_api.py -q
```

Common failures:

1. `GRAFANA_SA_TOKEN` missing or expired
2. Wrong `GRAFANA_URL`
3. Wrong datasource UID
4. Prometheus is not scraping `/metrics/`
5. Dashboard JSON still contains a hard-coded datasource UID

## Step 9: Rollback

If needed:

1. Disable `.github/workflows/sync-grafana-dashboards.yml`
2. Rotate or remove `GRAFANA_SA_TOKEN`
3. Revert the observability code
4. Remove the repo-owned dashboard JSON
5. Remove the app from the shared infra dashboard only if the metrics are being retired entirely

## Migration Checklist

Use this exact operator sequence for each existing app:

1. Copy the `observability/` package.
2. Add `prometheus-client`.
3. Add `TELEMETRY_NAMESPACE`, `TELEMETRY_METRICS_ENABLED`, and `TELEMETRY_METRICS_PATH`.
4. Insert `PrometheusMetricsMiddleware`.
5. Add `path("metrics/", metrics_view)` or the equivalent path derived from `TELEMETRY_METRICS_PATH`.
6. Import `observability.celery` from the app's Celery bootstrap.
7. Copy `docs/dashboards/<app>-overview.json`.
8. Copy `docs/dashboards/<app>-workers.json` if the app runs Celery workers.
9. Copy `scripts/sync_grafana_dashboards.py`.
10. Copy `scripts/install_grafana_sa_secret.sh`.
11. Copy `.github/workflows/sync-grafana-dashboards.yml`.
12. Configure Prometheus scraping for `/metrics/`.
13. Seed `GRAFANA_URL`, `GRAFANA_SA_TOKEN`, and `GRAFANA_PROMETHEUS_DATASOURCE_UID`.
14. Push to `main`.
15. Confirm dashboards appear and the shared fleet dashboard receives the new series.

## Fleet Rollout Order

For the next four repos, use the same sequence every time:

1. Backport the cookiecutter telemetry scaffold
2. Wire `/metrics/` scraping
3. Add repo-owned dashboards
4. Seed `GRAFANA_SA_TOKEN` with the helper script
5. Merge to `main`
6. Verify the app appears in the shared Django Apps dashboard
