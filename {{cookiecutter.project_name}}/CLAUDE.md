# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

    make venv              # create .venv with uv, install deps
    make test              # run pytest
    make format            # ruff format + ruff check --fix
    make dev               # docker compose up (full stack)
    make freeze            # lock deps to requirements.freeze.txt
    pytest tests/path/test_file.py::test_name -v   # run single test

    bin/dc up -d           # docker compose wrapper (sets UID/GID)
    bin/dc exec backend bash
    bin/djmanage migrate
    bin/djmanage createsuperuser

## Architecture

### Adaptive Environment Detection

Settings auto-configure based on which env vars are present. No env vars = zero-dep mode (embedded postgres, filesystem storage, eager celery). All env vars set = full stack.

| Env Var | Set | Not Set |
|---------|-----|---------|
| `DATABASE_URL` | PostgreSQL via URL | Embedded pgserver (`~/.{{cookiecutter.project_name}}/pgdata`) |
| `S3_ENDPOINT_URL` | S3Boto3Storage (Garage/AWS) | Django FileSystemStorage |
| `CELERY_BROKER_URL` | Redis async broker | Synchronous eager mode |

Settings load: `settings/project.py` → `settings/__init__.py` → optional `settings/local.py` (git-ignored, for dev overrides).

Test settings: loaded via `--ds={{cookiecutter.project_name}}.settings.test_settings` (configured in pyproject.toml). Uses pgserver, fast password hasher, in-memory email.

### API Layer

django-ninja mounted at `/api/`. Add new routers in `api/` directory and register them in `api/__init__.py` via `api.add_router("/prefix/", router)`.

JWT auth: `from ninja_jwt.authentication import JWTAuth`, use `auth=JWTAuth()` on endpoints. Interactive docs at `/api/docs`.

### Models

User model: `apps/users/models.py` — extends AbstractUser with string PK (MediumIDMixin), timestamps, email mixin, JWT token generation.

Available mixins from `utils/models.py`:
- `TimestampMixin` — created_at, updated_at with ordering
- `ShortIdMixin` / `MediumIDMixin` / `UUIDMixin` — string/UUID primary keys
- `ArchivedMixin` — soft delete via archived_at
- `ModelDiffMixin` — track field changes

### Storage & Presigned URLs

`utils/services/storage.py` provides `presigned_put_object(key, content_type)` and `presigned_get_object(key)`. Uses boto3 with SigV4 for Garage compatibility. Falls back to GCP if `GOOGLE_APPLICATION_CREDENTIALS` is set.

### Tasks

Use `@shared_task` from celery. Tasks are autodiscovered from `tasks.py` in any installed app. In zero-dep mode, tasks execute synchronously in-process.

### Telemetry

Prometheus metrics are exposed at `/metrics/`. The template already instruments HTTP requests and Celery task execution via `observability/`.

Managed Grafana dashboard JSON lives in `docs/dashboards/`, and GitHub Actions syncs it with `scripts/sync_grafana_dashboards.py`. Keep dashboards `editable=false`, tagged `json-managed`, and on a `30s` refresh interval.

### Admin

Use `@register(Model)` decorator from `utils/admin.py` — it auto-configures `raw_id_fields` for all relation fields.

### Infrastructure

Docker Compose services: Django backend, PostgreSQL 16, Redis 7, Garage (S3), Celery worker, Celery beat, Vite frontend, Caddy ingress.

Env files loaded via `.envrc`: `infra/common/.env` → `infra/dev/.env` → `.env.local` (git-ignored).

Production: Kubernetes + Helm. Deploy three workloads from the same image:
- `main` via `infra/prod/start-uvicorn.sh`
- `celery` via `infra/prod/start-celery-worker.sh`
- `beat` via `infra/prod/start-celery-beat.sh`

If a project defines `CELERY_BEAT_SCHEDULE`, `beat` must be deployed or those tasks will never run. See `infra/prod/README.md`.

## Test Patterns

Fixtures in `conftest.py`:
- `test_user` → returns `(user, client)` with user logged in
- `project_fixture_common` → `ProjectFixture` dataclass with settings, client, user
- `strong_pass` → "B0undC0rp!!"

User factory: `from {{cookiecutter.project_name}}.apps.users.factories import UserFactory`
