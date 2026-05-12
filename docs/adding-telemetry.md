# Adding Telemetry to an Existing Cookiecutter App

This runbook upgrades an existing cookiecutter app to the current telemetry baseline:

1. App-owned Prometheus instrumentation in Django and Celery.
2. App-owned Grafana dashboard JSON in `docs/dashboards/`.
3. A repo-local GitHub Actions sync job that updates Grafana on `main`.
4. One shared, infra-owned "Django Apps" dashboard in `infra-octo` for fleet-wide comparisons.

Use this with [`docs/plans/2026-05-12-telemetry-grafana-strategy.md`](./plans/2026-05-12-telemetry-grafana-strategy.md) and [`docs/plans/2026-05-12-telemetry-grafana-inventory-findings.md`](./plans/2026-05-12-telemetry-grafana-inventory-findings.md).

## Target State

After the migration:

1. The app exposes `/metrics/`.
2. Prometheus scrapes the app and worker metrics with a stable metric prefix.
3. The repo contains `docs/dashboards/<app>-overview.json` and, if applicable, `docs/dashboards/<app>-workers.json`.
4. `.github/workflows/sync-grafana-dashboards.yml` upserts those dashboards on every push to `main`.
5. All repo-owned dashboards are `editable=false`, tagged `json-managed`, and refresh every `30s`.
6. The app also contributes to the shared Django Apps dashboard installed separately from `infra-octo`.

## Template Files to Backport

When migrating an older app, copy or recreate these files from the current cookiecutter:

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

## Required Secrets and Vars

Each repo needs these GitHub secrets:

1. `GRAFANA_URL`
2. `GRAFANA_SA_TOKEN`
3. `GRAFANA_PROMETHEUS_DATASOURCE_UID`
4. `GRAFANA_FOLDER_UID` if you want a fixed target folder UID

The workflow also supports `GRAFANA_FOLDER_TITLE` as a fallback if you prefer letting the sync script create or find the folder by title.

## Step 1: Backport the instrumentation

Apply the template scaffolding and preserve the app's existing Sentry setup.

The current baseline emits:

1. `{{project_name}}_http_requests_total`
2. `{{project_name}}_http_request_duration_seconds`
3. `{{project_name}}_celery_task_started_total`
4. `{{project_name}}_celery_task_succeeded_total`
5. `{{project_name}}_celery_task_failures_total`
6. `{{project_name}}_celery_task_latency_seconds`

The request metrics are labeled by `host`, `method`, `route`, and `status_code`, which is enough to power the shared Django Apps dashboard with per-domain GET and POST usage.

## Step 2: Expose and scrape `/metrics/`

Confirm the app serves `/metrics/` from the Django process.

Then update the app's Kubernetes manifests or Helm values so Prometheus can scrape it. The exact mechanism can vary:

1. Pod annotations
2. A `ServiceMonitor`
3. An existing scrape job wired to the app's Service

Keep the scrape path consistent as `/metrics/` unless there is a hard reason not to.

## Step 3: Add repo-owned dashboards

Keep app-specific dashboards in the app repo. Use the template JSON as the starting point and adjust only the panels that are specific to that app.

Conventions:

1. `editable: false`
2. `tags` includes `json-managed`
3. `refresh: "30s"`
4. `timepicker.refresh_intervals` includes `10s`, `30s`, `1m`, `5m`, and `15m`
5. Use `__PROMETHEUS_DS_UID__` in the JSON and let the sync script replace it during CI

The repo dashboards should answer "what is happening inside this app?" The shared infra-owned dashboard should answer "how do all Django apps compare?"

## Step 4: Install the sync workflow

Add `.github/workflows/sync-grafana-dashboards.yml` and `scripts/sync_grafana_dashboards.py`.

The workflow:

1. Runs on `push` to `main`
2. Supports `workflow_dispatch`
3. Loads all `docs/dashboards/*.json`
4. Normalizes `editable`, `tags`, and `refresh`
5. Replaces `__PROMETHEUS_DS_UID__`
6. Upserts the dashboards through the Grafana HTTP API

This is intentionally separate from deploy so dashboard fixes can ship without a full app release.

## Step 5: Seed the Grafana token

Steady state is one GitHub secret per repo: `GRAFANA_SA_TOKEN`.

Recommended bootstrap flow:

1. Store the Grafana dashboard-writer token in a Kubernetes Secret in the octo cluster.
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

## Step 6: Shared Dashboard in `infra-octo`

Each app repo owns its own dashboards, but the fleet-wide "Django Apps" dashboard should still live in `infra-octo`.

That shared dashboard should graph cross-app queries using the standardized metrics:

1. GETs and POSTs per `host`
2. Error-rate by `host`
3. P95 request latency by `route`
4. Celery success and failure rates by app

Because every migrated app emits the same metric names and labels, the shared dashboard can be managed once in `infra-octo` while each repo keeps its own app-deep dashboards locally.

## Step 7: Validate

After the first push to `main`:

1. Hit the app a few times.
2. Confirm `/metrics/` returns Prometheus text output.
3. Confirm Prometheus ingests the new series.
4. Confirm the repo-owned dashboards appear in Grafana.
5. Confirm the shared Django Apps dashboard shows the app's traffic alongside the other apps.

Common failures:

1. `GRAFANA_SA_TOKEN` missing or expired
2. Wrong `GRAFANA_URL`
3. Wrong datasource UID
4. Prometheus is not scraping `/metrics/`
5. Dashboard JSON still contains a hard-coded datasource UID

## Step 8: Rollback

If needed:

1. Disable `.github/workflows/sync-grafana-dashboards.yml`
2. Rotate or remove `GRAFANA_SA_TOKEN`
3. Revert the observability code
4. Remove the repo-owned dashboard JSON
5. Remove the app from the shared infra dashboard only if the metrics are being retired entirely

## Fleet Rollout Order

For the next four repos, use the same sequence every time:

1. Backport the cookiecutter telemetry scaffold
2. Wire `/metrics/` scraping
3. Add repo-owned dashboards
4. Seed `GRAFANA_SA_TOKEN` with the helper script
5. Merge to `main`
6. Verify the app appears in the shared Django Apps dashboard
