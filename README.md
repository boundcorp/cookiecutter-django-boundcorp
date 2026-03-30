# cookiecutter-django-boundcorp

An opinionated Django project template with a three-tier development experience.

## Stack

- **Backend:** Django 5.2, django-ninja, Celery + Redis, PostgreSQL
- **Frontend:** Vite + React 19 + TypeScript
- **Storage:** Garage (S3-compatible) with presigned URL support, django-storages
- **Auth:** JWT via django-ninja-jwt
- **Infra:** Docker Compose (dev), Kubernetes + Helm (prod), GitHub Actions CI/CD
- **Secrets:** SOPS + Age encryption

## Usage

    pip install cookiecutter
    cookiecutter gh:boundcorp/cookiecutter-django-boundcorp

You'll be prompted for:

| Variable | Description |
|----------|-------------|
| `project_name` | Python package name (e.g. `myproject`) |
| `docker_image_url` | Docker registry URL (e.g. `ghcr.io/org/myproject`) |
| `development_backend_port` | Local Django port (default: 8822) |
| `development_frontend_port` | Local Vite port (default: 2288) |
| `development_ingress_port` | Local Caddy port (default: 2228) |
| `production_hostname` | Production domain |
| `author` | Your name |
| `email` | Your email |

## Three-Tier Dev Experience

### Tier 1: Zero-Dep Mode

    cd myproject
    make venv
    python manage.py migrate
    python manage.py runserver

No Docker needed. Uses embedded PostgreSQL via [pgserver](https://github.com/nicholasgasior/pgserver), filesystem storage, and Celery eager mode. Ideal for AI agents, git worktrees, and quick iteration.

### Tier 2: Docker Compose

    make dev

Runs the full stack: Django, PostgreSQL 16, Redis 7, Garage (S3), Celery worker, Vite dev server, and Caddy reverse proxy.

### Tier 3: AIO Sidecar (optional)

Single `docker run` with Postgres + Redis + Garage for environments that support one container but not compose (e.g. cloud AI agents). Documented in generated project, image maintained separately.

## What's Included

### Backend
- Custom User model with string IDs, timestamps, JWT tokens, email utilities
- Abstract model mixins: TimestampMixin, ShortIdMixin, MediumIDMixin, UUIDMixin, ArchivedMixin, ModelDiffMixin
- django-ninja API with health check and authenticated profile endpoint
- Celery with example task (eager mode when Redis unavailable)
- S3 presigned URL utilities (PUT/GET) compatible with Garage, MinIO, and AWS
- GCP Cloud Storage support (optional)
- PDF rendering via xhtml2pdf
- Custom Django admin with auto raw_id_fields
- Email template system with action button and notification emails

### Frontend
- Vite + React 19 + TypeScript stub
- API proxy to Django in dev mode
- No UI framework imposed — pick per project

### Infrastructure
- Multi-stage Dockerfile (base/builder/dev/release)
- Docker Compose with Postgres, Redis, Garage, Celery, Vite, Caddy
- Kubernetes Helm charts with rolling deploys and Let's Encrypt TLS
- GitHub Actions: test, build, deploy-staging (on PR), deploy-production (on merge)
- SOPS-encrypted secrets for Helm values

### Tooling
- pytest with Factory Boy, coverage reporting
- ruff for formatting and linting
- mypy for type checking
- Makefile for common tasks
