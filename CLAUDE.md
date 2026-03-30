# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A cookiecutter template that generates Django projects. Template files live under `{{cookiecutter.project_name}}/` and contain literal `{{cookiecutter.project_name}}` strings — these are Jinja2 variables rendered by cookiecutter at project creation time. Do not try to resolve them.

## Testing the Template

Generate a test project and verify it works:

    cd /tmp
    cookiecutter /path/to/this/repo --no-input project_name=testproject docker_image_url=ghcr.io/test/testproject production_hostname=test.example.com author="Test" email="test@example.com"
    cd testproject
    uv venv .venv --python python3.12
    source .venv/bin/activate
    uv pip install -e .
    python manage.py check
    python manage.py migrate
    pytest -v

## Cookiecutter Rendering Rules

`cookiecutter.json` controls which files are rendered vs copied as-is via `_copy_without_render`:
- `*.html` — Django templates use `{{ }}` syntax that conflicts with Jinja2
- `.github` — GitHub Actions use `${{ }}` syntax
- `frontend/` — React/TSX files may contain `{` patterns
- `fixtures/` — data files

**YAML files (compose, helm) ARE rendered** — they use `{{cookiecutter.project_name}}` variables intentionally. Don't add `*.yml` to `_copy_without_render`.

## Architecture of Generated Projects

The generated project uses **adaptive environment detection** — settings auto-configure based on which env vars are present:

| Env Var | Set | Not Set |
|---------|-----|---------|
| `DATABASE_URL` | Parses PostgreSQL URL | Embedded pgserver |
| `S3_ENDPOINT_URL` | S3Boto3Storage (Garage/AWS) | Django FileSystemStorage |
| `CELERY_BROKER_URL` | Redis async broker | `CELERY_TASK_ALWAYS_EAGER=True` |

This enables three tiers: zero-dep (no env vars), compose (all set via `infra/dev/.env`), production (all set via secrets).

Settings load order: `settings/project.py` → `settings/__init__.py` imports it → optional `settings/local.py` overlay.

## Key Patterns

- **API**: django-ninja at `api/__init__.py`, routers added via `api.add_router()`. JWT auth via `ninja_jwt.authentication.JWTAuth`.
- **Models**: Use mixins from `utils/models.py` (TimestampMixin, MediumIDMixin, etc). User model has string PKs, not auto-increment.
- **Admin**: `@register` decorator from `utils/admin.py` auto-sets `raw_id_fields`.
- **Storage**: Presigned URLs via `utils/services/storage.py`. Uses boto3 with SigV4 (`signature_version="s3v4"`) for Garage compatibility.
- **Tasks**: `@shared_task` decorator, autodiscovered by Celery.
- **Tests**: pytest + factory-boy. `conftest.py` provides `test_user` and `project_fixture_common` fixtures.
