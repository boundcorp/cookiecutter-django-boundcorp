# Cookiecutter Django Boundcorp — Modernization

## Summary

Strip legacy frontend (NextJS, Apollo, GraphQL) and backend (django-q, MinIO, DRF) in favor of a modern stack: Vite+React, django-ninja, Celery+Redis, and Garage. Introduce a three-tier dev experience that makes the project usable without Docker for AI agents, worktrees, and quick iteration.

## What's Being Removed

- NextJS frontend (`frontend/` directory, all React/Apollo/MUI code)
- Apollo Client, GraphQL schema, codegen config
- django-q task queue
- MinIO object storage
- DRF (django-rest-framework) — replaced by django-ninja
- All GraphQL-related Python/JS dependencies

## What's Being Added/Replaced

### Frontend: Vite + React + TypeScript

- Separate `frontend/` directory with its own `package.json`
- Vite dev server runs independently, proxied through Caddy alongside Django API
- Minimal stub: a page that hits a django-ninja endpoint and displays the result
- No UI framework imposed (no MUI, no Tailwind — user picks per-project)

### API: django-ninja

- Replaces DRF + GraphQL
- Stub API mounted at `/api/v1/`
- Endpoints: health check, user profile (authenticated)
- JWT auth via django-ninja-jwt or django-ninja's built-in auth

### Task Queue: Celery + Redis

- Replaces django-q
- `CELERY_TASK_ALWAYS_EAGER = True` in zero-dep dev mode — tasks run synchronously in-process
- Redis as broker when running full stack via compose
- Stub task included as example

### Object Storage: Garage

- Replaces MinIO — same S3 API, presigned URLs supported (GET and PUT via SigV4)
- Lighter than MinIO (Rust vs Java), faster startup/shutdown
- Update storage abstraction to use boto3 with Garage endpoint
- In zero-dep mode, fall back to Django's `FileSystemStorage`

## Three-Tier Dev Experience

### Tier 1: Zero-dep mode (default)

- `python manage.py runserver` — works immediately
- Embedded Postgres via `pgserver` — real Postgres, no external server needed
  - Data stored in `~/.{project_name}/pgdata` (or configurable)
  - Locale forced to `C.UTF-8` for container compatibility
  - Same engine as production — no SQLite/Postgres divergence
- `FileSystemStorage` for media
- `CELERY_TASK_ALWAYS_EAGER = True` — no Redis needed
- No Docker required
- Ideal for: AI agents, git worktrees, quick iteration, new contributors
- Activated automatically when `DATABASE_URL` is not set

### Tier 2: Docker Compose full stack

- Postgres, Redis, Garage, Celery worker, Vite dev server, Caddy ingress
- For integration testing and full-stack development
- `docker compose up` from `infra/dev/`
- Services:
  - `backend` — Django dev server
  - `psql` — PostgreSQL
  - `redis` — Redis (Celery broker + cache)
  - `garage` — S3-compatible object storage
  - `celery` — Celery worker
  - `frontend` — Vite dev server
  - `ingress` — Caddy reverse proxy

### Tier 3: AIO services sidecar (optional)

- Single pre-built Docker image running Postgres + Redis + Garage via s6-overlay
- Published to ghcr.io — not built per-project
- Usage: `docker run ghcr.io/boundcorp/dev-services` + `python manage.py runserver`
- Middle ground: real services without compose complexity
- Ideal for: cloud AI agents that can run one container but not compose
- **Note:** This image is maintained separately, not part of the cookiecutter itself. The cookiecutter just documents how to use it.

## Settings Structure

### Detection logic in `settings/project.py`

```python
# Locale fix for pgserver in containers
for _lc_var in ("LC_ALL", "LANG", "LC_CTYPE", "LC_MESSAGES", "LC_COLLATE"):
    os.environ.setdefault(_lc_var, "C.UTF-8")

# Database
if os.environ.get("DATABASE_URL"):
    # Parse DATABASE_URL → Postgres config
else:
    import pgserver
    _pg = pgserver.get_server(str(DATA_DIR / "pgdata"), cleanup_mode=None)
    # Parse pgserver URI → Django DATABASES config

# Storage
if os.environ.get("S3_ENDPOINT_URL"):
    # boto3 / django-storages with Garage endpoint
else:
    # Django FileSystemStorage

# Celery
if os.environ.get("CELERY_BROKER_URL"):
    # Redis broker
else:
    CELERY_TASK_ALWAYS_EAGER = True
```

### `settings/test_settings.py`
- pgserver (or SQLite for speed — TBD), eager Celery, filesystem storage

## Infrastructure Updates

### Dockerfile
- Update Python base image to 3.12+
- Keep uv for package management
- Drop Bun, add Node 22 for Vite build in release stage
- Multi-stage: base → builder → dev / release

### Docker Compose (`infra/dev/compose.yml`)
- Replace MinIO service with Garage
- Add Redis service
- Add Celery worker service
- Update frontend service from NextJS to Vite
- Keep Caddy ingress

### Caddy reverse proxy
- `/api/*` → Django backend
- `/mgmt/*` → Django backend (admin)
- `/healthz/*` → Django backend
- `/dj-static/*` → Django backend (static)
- `/assets/*` → Garage (media)
- `/*` → Vite dev server (frontend)

### Kubernetes / Helm
- Keep existing chart structure
- Update image references
- Add Redis to cluster dependencies (or use managed Redis)

### GitHub Actions
- Update test workflow (Python 3.12, add Redis service)
- Update build workflow for new Dockerfile
- Deploy workflows: keep as-is, update if Helm values change

### SOPS
- Keep as-is

## Kept As-Is

- Custom User model (JWT via `django.core.signing`, MediumID, MailMixin)
- Abstract model mixins (TimestampMixin, UUIDMixin, ArchivedMixin, ModelDiffMixin, ShortIdMixin)
- Email template system (prepare_email, MailMixin with notification/action button emails)
- Custom AdminSite with `@register` decorator
- PDF rendering utility (xhtml2pdf)
- Test infrastructure (pytest, Factory Boy, conftest fixtures)
- `pyproject.toml` tooling config (ruff, mypy, pytest)
- `bin/` scripts (update for new services, remove obsolete)
- Makefile targets (update for new stack)

## Dependency Changes

### Python — Remove
- `django-q2` or `django-q`
- `django-minio-storage` (or whatever MinIO client)
- `djangorestframework`
- `graphene-django` (if present)

### Python — Add
- `django-ninja`
- `django-ninja-jwt` (or equivalent)
- `celery[redis]`
- `django-storages[s3]` (boto3-based, works with Garage)
- `pgserver` (embedded Postgres for zero-dep dev mode)

### Python — Keep
- `django`, `psycopg2-binary`, `whitenoise`, `django-cors-headers`
- `django-filter`, `django-extensions`, `factory-boy`, `pytest-django`
- `xhtml2pdf`, `sentry-sdk`
- `ruff`, `mypy`, `black`, `isort`

### JavaScript — Remove
- Everything in current `frontend/package.json` (Next, Apollo, MUI, etc.)

### JavaScript — Add
- `vite`, `react`, `react-dom`, `typescript`, `@vitejs/plugin-react`
- Minimal — no UI framework by default

## Out of Scope

- AIO sidecar image build/publish (separate repo/project)
- Production Garage deployment (cluster-specific)
- Frontend UI framework selection (per-project decision)
- Migration tooling from old cookiecutter projects
