# Cookiecutter Django Boundcorp Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip legacy frontend/API/task/storage layers and replace with Vite+React, django-ninja, Celery+Redis, Garage, and pgserver-based zero-dep dev mode.

**Architecture:** Three-tier dev experience — Tier 1 (zero-dep: pgserver + filesystem + eager celery), Tier 2 (compose: postgres + redis + garage + celery worker + vite + caddy), Tier 3 (AIO sidecar, documented only). All template files live under `{{cookiecutter.project_name}}/` and use cookiecutter variable syntax.

**Tech Stack:** Django 5+, django-ninja, Celery, Redis, Garage (S3), pgserver, Vite, React 19, TypeScript

**Important context:** All file paths below are relative to the repo root. The cookiecutter template directory is `{{cookiecutter.project_name}}/`. Template variables like `{{cookiecutter.project_name}}` appear literally in files — they're rendered by cookiecutter at project creation time.

---

### Task 1: Strip legacy frontend, GraphQL, and DRF

**Files:**
- Delete: `{{cookiecutter.project_name}}/frontend/` (entire directory)
- Delete: `{{cookiecutter.project_name}}/schema.graphql`
- Modify: `{{cookiecutter.project_name}}/pyproject.toml`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/urls.py`
- Modify: `{{cookiecutter.project_name}}/conftest.py`
- Delete: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/apps/users/filters.py`
- Modify: `{{cookiecutter.project_name}}/cookiecutter.json` (if needed)

- [ ] **Step 1: Delete the frontend directory and GraphQL schema**

```bash
rm -rf "{{cookiecutter.project_name}}/frontend"
rm -f "{{cookiecutter.project_name}}/schema.graphql"
rm -f "{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/apps/users/filters.py"
```

- [ ] **Step 2: Remove DRF, GraphQL, MinIO, django-q, and other legacy deps from pyproject.toml**

Replace the `[tool.poetry.dependencies]` section in `{{cookiecutter.project_name}}/pyproject.toml`:

```toml
[tool.poetry.dependencies]
python = "^3.12"
django = "^5.2"
django-environ = "*"
django-cors-headers = "*"
django-ninja = "*"
django-ninja-jwt = "*"
django-extensions = "*"
django-filter = "*"
django-storages = {extras = ["s3"], version = "*"}
celery = {extras = ["redis"], version = "*"}
pgserver = "*"
psycopg = {extras = ["binary"], version = "*"}
uvicorn = "*"
whitenoise = "*"
pydantic = "*"
pytz = "*"
requests = "*"
factory-boy = "*"
ruff = "*"
pytest = "*"
pytest-django = "*"
```

- [ ] **Step 3: Remove DRF and MinIO from INSTALLED_APPS in settings/project.py**

Replace the `INSTALLED_APPS` list in `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`:

```python
INSTALLED_APPS = [
    "django.contrib.auth",
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.contenttypes",
    "django.contrib.humanize",
    "django.contrib.sessions",
    "django.contrib.sites",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "storages",
    "django_filters",
    "django_extensions",
    "{{cookiecutter.project_name}}.apps.users",
]
```

- [ ] **Step 4: Remove DRF router from urls.py**

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/urls.py` entirely:

```python
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from {{cookiecutter.project_name}}.utils.admin import admin_site
from {{cookiecutter.project_name}}.api import api

urlpatterns = [
    path("api/", api.urls),
    path("mgmt/", admin_site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 5: Remove graphql_jwt from conftest.py**

Replace `{{cookiecutter.project_name}}/conftest.py`:

```python
import django.conf
import pytest
from dataclasses import dataclass

from {{cookiecutter.project_name}}.apps.users.factories import UserFactory
from {{cookiecutter.project_name}}.apps.users.models import User


@pytest.fixture
def strong_pass():
    return "B0undC0rp!!"


@pytest.fixture
def test_user(db, strong_pass, client):
    user = UserFactory(password=strong_pass)
    client.force_login(user)
    return user, client


@dataclass
class ProjectFixture:
    settings: django.conf.Settings
    client: django.test.client.Client
    user: User


@pytest.fixture
def project_fixture_common(db, settings, test_user):
    user, client = test_user
    return ProjectFixture(settings=settings, user=user, client=client)
```

- [ ] **Step 6: Update cookiecutter.json — remove frontend port if desired**

No change needed — keep `development_frontend_port` since Vite will use it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: strip NextJS frontend, GraphQL, DRF, and legacy deps"
```

---

### Task 2: Replace database config with pgserver zero-dep mode

**Files:**
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/test_settings.py`

- [ ] **Step 1: Rewrite database config in settings/project.py**

Replace the database section (lines 31-49) in `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`. Remove the old `DATABASE_HOST`/`DATABASE_NAME`/etc. variables and replace with:

```python
from pathlib import Path
from urllib.parse import urlparse, parse_qs

# pgserver locale fix for containers
for _lc_var in ("LC_ALL", "LANG", "LC_CTYPE", "LC_MESSAGES", "LC_COLLATE"):
    os.environ.setdefault(_lc_var, "C.UTF-8")

DATA_DIR = Path(os.environ.get(
    "DATA_DIR",
    os.path.expanduser(f"~/.{{{{cookiecutter.project_name}}}}")
))
DATA_DIR.mkdir(parents=True, exist_ok=True)

_database_url = os.environ.get("DATABASE_URL")
if _database_url:
    _parsed = urlparse(_database_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _parsed.path.lstrip("/") or "postgres",
            "USER": _parsed.username or "postgres",
            "PASSWORD": _parsed.password or "",
            "HOST": _parsed.hostname or "",
            "PORT": str(_parsed.port or 5432),
        }
    }
else:
    import pgserver
    _pg = pgserver.get_server(str(DATA_DIR / "pgdata"), cleanup_mode=None)
    _parsed = urlparse(_pg.get_uri())
    _qs = parse_qs(_parsed.query)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _parsed.path.lstrip("/") or "postgres",
            "USER": _parsed.username or "postgres",
            "PASSWORD": _parsed.password or "",
            "HOST": _qs.get("host", [""])[0] or (_parsed.hostname or ""),
        }
    }
```

Also remove the `from urllib.parse import urlparse` at the top of the file (line 5) since we now import it inline above. Remove the `import environ` and `env = environ.Env(...)` lines — we're not using django-environ anymore for database config. Keep the `env_variable_truthy` helper since it's used for storage.

- [ ] **Step 2: Update test_settings.py to use pgserver instead of SQLite**

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/test_settings.py`:

```python
import logging
import os
import sys

if "TEST_USE_ENV" not in os.environ:
    del sys.modules["{{cookiecutter.project_name}}.settings"]
    del sys.modules["{{cookiecutter.project_name}}.settings.project"]

from {{cookiecutter.project_name}}.settings import *

SECRET_KEY = "Test Only Key"
IS_TEST = True

logging.disable(logging.CRITICAL)
DEBUG = True

PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
BASE_URL = f"http://localhost:{BACKEND_PORT}"

# pgserver handles the database automatically — no override needed.
# Tests use the same embedded postgres as dev, with a test-specific database.
```

- [ ] **Step 3: Verify the template renders (manual check, not automated)**

After cookiecutter generation, `python manage.py check` should work without any external database.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: replace hardcoded postgres config with pgserver zero-dep mode"
```

---

### Task 3: Replace MinIO storage with Garage/boto3

**Files:**
- Rewrite: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/services/storage.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py` (storage section)

- [ ] **Step 1: Rewrite storage settings in project.py**

Replace the storage section (lines 249-272 in the original, the `credentials_file` / GCP / MinIO block) with:

```python
# Object storage: S3-compatible (Garage/MinIO/AWS) or local filesystem
_s3_endpoint = os.environ.get("S3_ENDPOINT_URL")
if _s3_endpoint:
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    AWS_S3_ENDPOINT_URL = _s3_endpoint
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "dev")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "dev12345678")
    AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "{{cookiecutter.project_name}}-media")
    AWS_S3_USE_SSL = env_variable_truthy("AWS_S3_USE_SSL")
    AWS_QUERYSTRING_AUTH = True  # presigned URLs
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None

    credentials_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if os.path.exists(credentials_file):
        from google.oauth2 import service_account
        DEFAULT_FILE_STORAGE = "storages.backends.gcloud.GoogleCloudStorage"
        GS_BUCKET_NAME = os.environ.get("GS_BUCKET_NAME", "")
        GS_PROJECT_ID = os.environ.get("GS_PROJECT_ID", "")
        GS_CREDENTIALS = service_account.Credentials.from_service_account_file(credentials_file)
# else: Django default FileSystemStorage (no config needed)
```

- [ ] **Step 2: Rewrite storage.py to use boto3**

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/services/storage.py`:

```python
from datetime import timedelta

from django.conf import settings


def _get_s3_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def presigned_put_object(key, content_type, expires=3600):
    if hasattr(settings, "GS_CREDENTIALS"):
        return _gcp_presigned_put_object(key, content_type, expires)
    if hasattr(settings, "AWS_S3_ENDPOINT_URL"):
        client = _get_s3_client()
        return client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires,
        )
    raise RuntimeError("No object storage configured — set S3_ENDPOINT_URL or GOOGLE_APPLICATION_CREDENTIALS")


def presigned_get_object(key, expires=86400):
    if hasattr(settings, "GS_CREDENTIALS"):
        return _gcp_presigned_get_object(key, expires)
    if hasattr(settings, "AWS_S3_ENDPOINT_URL"):
        client = _get_s3_client()
        return client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
            },
            ExpiresIn=expires,
        )
    raise RuntimeError("No object storage configured — set S3_ENDPOINT_URL or GOOGLE_APPLICATION_CREDENTIALS")


def _gcp_presigned_put_object(key, content_type, expires=3600):
    from google.cloud import storage
    client = storage.Client(credentials=settings.GS_CREDENTIALS)
    bucket = client.bucket(settings.GS_BUCKET_NAME)
    blob = bucket.blob(key)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(seconds=expires),
        content_type=content_type,
        method="PUT",
    )


def _gcp_presigned_get_object(key, expires=86400):
    from google.cloud import storage
    client = storage.Client(credentials=settings.GS_CREDENTIALS)
    bucket = client.bucket(settings.GS_BUCKET_NAME)
    blob = bucket.blob(key)
    return blob.generate_signed_url(
        version="v4",
        method="GET",
        expiration=timedelta(seconds=expires),
    )
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: replace MinIO storage with boto3/Garage S3-compatible storage"
```

---

### Task 4: Replace django-q with Celery

**Files:**
- Rewrite: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/tasks.py`
- Create: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/celery.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/__init__.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py` (add celery config)

- [ ] **Step 1: Add Celery config to settings/project.py**

Add at the end of `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`, before the Sentry block:

```python
# Celery
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL")
if CELERY_BROKER_URL:
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
else:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
```

- [ ] **Step 2: Create celery.py app config**

Create `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/celery.py`:

```python
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "{{cookiecutter.project_name}}.settings")

app = Celery("{{cookiecutter.project_name}}")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

- [ ] **Step 3: Update __init__.py to load celery**

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/__init__.py`:

```python
from .celery import app as celery_app

__all__ = ("celery_app",)
```

- [ ] **Step 4: Rewrite utils/tasks.py for Celery**

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/tasks.py`:

```python
from celery import shared_task


@shared_task
def example_task():
    """Example Celery task. Replace or remove in your project."""
    return "ok"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: replace django-q with Celery + Redis"
```

---

### Task 5: Create django-ninja API stub

**Files:**
- Create: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/__init__.py`
- Create: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/auth.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/health.py`
- Delete: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/stripe.py`
- Modify: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/__init__.py`

- [ ] **Step 1: Create API module with ninja router**

Create `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/__init__.py`:

```python
from ninja import NinjaAPI
from ninja_jwt.authentication import JWTAuth

api = NinjaAPI(title="{{cookiecutter.project_name}}", version="1.0.0")


@api.get("/healthz")
def healthz(request):
    from django.db import connection
    try:
        connection.ensure_connection()
    except Exception as e:
        return {"status": False, "detail": str(e)}
    return {"status": True}


# Import routers
from {{cookiecutter.project_name}}.api.auth import router as auth_router

api.add_router("/auth/", auth_router)
```

- [ ] **Step 2: Create auth router with profile endpoint**

Create `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/auth.py`:

```python
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

router = Router(tags=["auth"])


class UserProfileSchema(Schema):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    account_type: str


@router.get("/profile", auth=JWTAuth(), response=UserProfileSchema)
def profile(request):
    return request.auth
```

- [ ] **Step 3: Add ninja-jwt to INSTALLED_APPS and settings**

In `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/project.py`, add `"ninja_jwt"` to `INSTALLED_APPS` list (after `"django_extensions"`).

Also add ninja-jwt URL config. Update `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/settings/urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from {{cookiecutter.project_name}}.utils.admin import admin_site
from {{cookiecutter.project_name}}.api import api

urlpatterns = [
    path("api/", api.urls),
    path("mgmt/", admin_site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

(This was already set in Task 1 Step 4 — no change needed if that was applied.)

- [ ] **Step 4: Remove old DRF-based health view and stripe stub**

Delete `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/stripe.py`.

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/__init__.py`:

```python
# Views module — health check is now in the API router
```

Replace `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/health.py`:

```python
# Health check moved to api/__init__.py
# This file kept for backwards compatibility — remove if unused.
```

- [ ] **Step 5: Write test for health and profile endpoints**

Create `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/tests/__init__.py` (empty).

Create `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/api/tests/test_api.py`:

```python
import pytest
from django.test import Client


@pytest.mark.django_db
def test_healthz(client: Client):
    response = client.get("/api/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True


@pytest.mark.django_db
def test_profile_unauthenticated(client: Client):
    response = client.get("/api/auth/profile")
    assert response.status_code == 401


@pytest.mark.django_db
def test_profile_authenticated(test_user):
    user, client = test_user
    # django-ninja-jwt uses token auth, but force_login works for test client
    # We need to get a JWT token for the ninja endpoint
    from ninja_jwt.tokens import AccessToken
    token = str(AccessToken.for_user(user))
    response = client.get("/api/auth/profile", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user.email
    assert data["username"] == user.username
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add django-ninja API with health check and auth profile endpoints"
```

---

### Task 6: Create Vite + React frontend stub

**Files:**
- Create: `{{cookiecutter.project_name}}/frontend/package.json`
- Create: `{{cookiecutter.project_name}}/frontend/vite.config.ts`
- Create: `{{cookiecutter.project_name}}/frontend/tsconfig.json`
- Create: `{{cookiecutter.project_name}}/frontend/index.html`
- Create: `{{cookiecutter.project_name}}/frontend/src/main.tsx`
- Create: `{{cookiecutter.project_name}}/frontend/src/App.tsx`
- Create: `{{cookiecutter.project_name}}/frontend/.gitignore`

- [ ] **Step 1: Create package.json**

Create `{{cookiecutter.project_name}}/frontend/package.json`:

```json
{
  "name": "{{cookiecutter.project_name}}-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts with API proxy**

Create `{{cookiecutter.project_name}}/frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/mgmt': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Create tsconfig.json**

Create `{{cookiecutter.project_name}}/frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create index.html**

Create `{{cookiecutter.project_name}}/frontend/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{cookiecutter.project_name}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create React entry point and App component**

Create `{{cookiecutter.project_name}}/frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Create `{{cookiecutter.project_name}}/frontend/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<{ status: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/healthz')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: false }))
  }, [])

  return (
    <div>
      <h1>{{cookiecutter.project_name}}</h1>
      <p>API status: {health === null ? 'loading...' : health.status ? 'ok' : 'error'}</p>
    </div>
  )
}

export default App
```

- [ ] **Step 6: Create frontend .gitignore**

Create `{{cookiecutter.project_name}}/frontend/.gitignore`:

```
node_modules
dist
*.local
```

- [ ] **Step 7: Add frontend/ to cookiecutter.json _copy_without_render**

In `cookiecutter.json`, ensure `frontend/src` TSX files are in `_copy_without_render` (to avoid `{{` in JSX being interpreted as cookiecutter variables). Check the existing list — the current config already has `"frontend/*.tsx"` entries. Update if needed to cover the new file paths:

```json
"_copy_without_render": [
    "*.html",
    "frontend/",
    ".github/",
    "fixtures/"
]
```

Note: The `frontend/index.html` uses `{{cookiecutter.project_name}}` in the `<title>`, so `index.html` should NOT be in copy_without_render. Move it to a separate concern or use a plain title that doesn't need templating. Simplest fix: use a generic title in index.html and let the React app set it dynamically, OR exclude only `frontend/src/` from rendering:

```json
"_copy_without_render": [
    "fixtures/",
    "frontend/src/",
    ".github/"
]
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Vite + React frontend stub with API proxy"
```

---

### Task 7: Update Docker and Compose infrastructure

**Files:**
- Rewrite: `{{cookiecutter.project_name}}/Dockerfile`
- Rewrite: `{{cookiecutter.project_name}}/infra/dev/compose.yml`
- Rewrite: `{{cookiecutter.project_name}}/infra/common/compose.yml`
- Rewrite: `{{cookiecutter.project_name}}/infra/dev/Caddyfile`
- Rewrite: `{{cookiecutter.project_name}}/infra/dev/.env`
- Modify: `{{cookiecutter.project_name}}/infra/common/.env`
- Delete: `{{cookiecutter.project_name}}/infra/dev/minio/` (entire directory)
- Modify: `{{cookiecutter.project_name}}/infra/dev/start-runserver.sh`
- Modify: `{{cookiecutter.project_name}}/infra/prod/start-uvicorn.sh`

- [ ] **Step 1: Rewrite Dockerfile**

Replace `{{cookiecutter.project_name}}/Dockerfile`:

```dockerfile
ARG IMAGE_VERSION=python:3.12-slim

#
# Base Stage
FROM ${IMAGE_VERSION} AS base

ENV PATH=/app/.venv/bin:$PATH \
    LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1

RUN mkdir /.cache && chmod -R 777 /.cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libjpeg-dev \
    libcurl4-openssl-dev \
    bash \
    libxml2-dev \
    libxslt-dev \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools uv

# Install Node.js for Vite build
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

#
# Builder Stage
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.freeze.txt /app/
RUN uv venv /app/.venv
RUN uv pip install --no-cache-dir -r requirements.freeze.txt

# Build frontend
COPY frontend/package.json frontend/package-lock.json* /app/frontend/
RUN cd /app/frontend && npm ci
COPY frontend/ /app/frontend/
RUN cd /app/frontend && npm run build

COPY {{cookiecutter.project_name}}/ /app/{{cookiecutter.project_name}}
COPY infra/ /app/infra
COPY manage.py /app/

#
# Developer Stage
FROM base AS dev

ENV PYTHONPATH=/app:$PYTHONPATH \
    VIRTUAL_ENV=/venv

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    libxml2-dev \
    libxslt-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip setuptools uv

WORKDIR /app

RUN uv venv /venv
COPY requirements.freeze.txt /app/
RUN uv pip install --no-cache-dir -r requirements.freeze.txt

ENV PATH="/venv/bin:/usr/local/bin:${PATH}"

COPY {{cookiecutter.project_name}}/ /app/{{cookiecutter.project_name}}
COPY infra/ /app/infra
RUN uv pip install -r requirements.freeze.txt

#
# Release Stage
FROM base AS release

RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
WORKDIR /app

RUN mkdir -p /app/static/uploads && chmod 777 /app/static/uploads
ENV PATH=/app/.venv/bin:$PATH

RUN python manage.py collectstatic --noinput
```

- [ ] **Step 2: Delete MinIO docker config**

```bash
rm -rf "{{cookiecutter.project_name}}/infra/dev/minio"
```

- [ ] **Step 3: Rewrite infra/common/compose.yml**

Replace `{{cookiecutter.project_name}}/infra/common/compose.yml`:

```yaml
services:
  {{cookiecutter.project_name}}-django-dev:
    build:
      context: ../../
      dockerfile: Dockerfile
      target: dev
    image: {{cookiecutter.docker_image_url}}/dev:latest
  {{cookiecutter.project_name}}-django:
    build:
      context: ../../
      dockerfile: Dockerfile
      target: release
    image: {{cookiecutter.docker_image_url}}/release:latest
```

- [ ] **Step 4: Rewrite infra/dev/compose.yml**

Replace `{{cookiecutter.project_name}}/infra/dev/compose.yml`:

```yaml
services:
  ############################################################
  # Django Services
  ############################################################
  .common-django-settings: &common-django-settings
    extends:
      service: {{cookiecutter.project_name}}-django-dev
      file: ../common/compose.yml
    volumes:
      - ../../:/app
    depends_on:
      - psql
      - redis
    env_file:
      - ../common/.env
      - ../dev/.env

  django_shell:
    <<: *common-django-settings
    environment:
      - SERVICE=django_shell
    command: "bash"
    entrypoint: []

  backend:
    <<: *common-django-settings
    ports:
      - "{{cookiecutter.development_backend_port}}:8000"
    entrypoint: ["/app/infra/dev/entrypoint.sh"]
    command: ["/app/infra/dev/start-runserver.sh"]
    environment:
      - SERVICE=backend

  celery:
    <<: *common-django-settings
    command: ["celery", "-A", "{{cookiecutter.project_name}}", "worker", "-l", "info"]
    environment:
      - SERVICE=celery

  ############################################################
  # Frontend
  ############################################################
  frontend:
    image: node:22-slim
    working_dir: /app/frontend
    volumes:
      - ../../frontend:/app/frontend
    command: ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]
    ports:
      - "{{cookiecutter.development_frontend_port}}:3000"

  ############################################################
  # 3rd Party Services
  ############################################################
  psql:
    image: postgres:16-alpine
    expose: ["5432"]
    environment:
      POSTGRES_DB: {{cookiecutter.project_name}}
      POSTGRES_USER: {{cookiecutter.project_name}}
      POSTGRES_PASSWORD: {{cookiecutter.project_name}}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    expose: ["6379"]

  garage:
    image: dxflrs/garage:v1.1.0
    expose: ["3900"]
    ports:
      - "3900:3900"  # S3 API
      - "3902:3902"  # Admin API
    environment:
      GARAGE_ALLOW_WORLD_READABLE_SECRETS: "true"
    volumes:
      - garage-data:/var/lib/garage/data
      - garage-meta:/var/lib/garage/meta
      - ./garage.toml:/etc/garage.toml

  ############################################################
  # Ingress
  ############################################################
  ingress:
    image: caddy:2-alpine
    ports:
      - "{{cookiecutter.development_ingress_port}}:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
    depends_on:
      - backend
      - frontend

volumes:
  pgdata:
  garage-data:
  garage-meta:
```

- [ ] **Step 5: Create Garage config for dev**

Create `{{cookiecutter.project_name}}/infra/dev/garage.toml`:

```toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"

replication_factor = 1

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

[s3_web]
bind_addr = "[::]:3902"
root_domain = ".web.garage.localhost"

[admin]
api_bind_addr = "[::]:3903"
admin_token = "dev-admin-token"
```

- [ ] **Step 6: Rewrite Caddyfile**

Replace `{{cookiecutter.project_name}}/infra/dev/Caddyfile`:

```
:80 {
    route /mgmt/* {
        reverse_proxy http://backend:8000
    }
    route /api/* {
        reverse_proxy http://backend:8000
    }
    route /dj-static/* {
        reverse_proxy http://backend:8000
    }
    route /* {
        reverse_proxy http://frontend:3000
    }
    redir /mgmt /mgmt/
}
```

- [ ] **Step 7: Rewrite infra/dev/.env**

Replace `{{cookiecutter.project_name}}/infra/dev/.env`:

```
DEVELOP_BACKEND_PORT={{cookiecutter.development_backend_port}}
DEVELOP_FRONTEND_PORT={{cookiecutter.development_frontend_port}}
DEVELOP_INGRESS_PORT={{cookiecutter.development_ingress_port}}
DATABASE_URL=postgresql://{{cookiecutter.project_name}}:{{cookiecutter.project_name}}@psql:5432/{{cookiecutter.project_name}}
CELERY_BROKER_URL=redis://redis:6379/0
S3_ENDPOINT_URL=http://garage:3900
AWS_ACCESS_KEY_ID=dev
AWS_SECRET_ACCESS_KEY=dev12345678
AWS_STORAGE_BUCKET_NAME={{cookiecutter.project_name}}-media
DEBUG=true
SECRET_KEY=django-insecure-1234567890abcdef
```

- [ ] **Step 8: Update start-runserver.sh**

Replace `{{cookiecutter.project_name}}/infra/dev/start-runserver.sh`:

```bash
#!/usr/bin/env bash
python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000
```

- [ ] **Step 9: Update start-uvicorn.sh**

Replace `{{cookiecutter.project_name}}/infra/prod/start-uvicorn.sh`:

```bash
#!/usr/bin/env bash
/app/.venv/bin/python3 manage.py migrate
/app/.venv/bin/celery -A {{cookiecutter.project_name}} worker -l info --detach
/app/.venv/bin/uvicorn \
    {{cookiecutter.project_name}}.asgi:application \
    --host 0.0.0.0 \
    --port 8000
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: update Docker/Compose infra — Garage, Redis, Celery, Vite, Node 22"
```

---

### Task 8: Update GitHub Actions workflows

**Files:**
- Modify: `{{cookiecutter.project_name}}/.github/workflows/test.yml`
- Modify: `{{cookiecutter.project_name}}/.github/workflows/build.yml`

- [ ] **Step 1: Update test.yml**

Replace `{{cookiecutter.project_name}}/.github/workflows/test.yml`:

```yaml
name: Test

on:
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      psql:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: postgres
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: .venv
        key: {% raw %}${{ runner.os }}{% endraw %}-venv-{% raw %}${{ hashFiles('**/requirements.freeze.txt') }}{% endraw %}
        restore-keys: |
          {% raw %}${{ runner.os }}{% endraw %}-venv-
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip uv
        uv venv
        uv pip install -e .
    - name: Run tests and linting
      run: |
        source .venv/bin/activate
        make format
        make test_backend_coverage
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres
```

- [ ] **Step 2: Update build.yml — target name change**

Replace `{{cookiecutter.project_name}}/.github/workflows/build.yml`:

```yaml
name: Build

on:
  workflow_call:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: {% raw %}${{ github.repository }}{% endraw %}

permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: {% raw %}${{ env.REGISTRY }}{% endraw %}
        username: {% raw %}${{ github.actor }}{% endraw %}
        password: {% raw %}${{ secrets.GITHUB_TOKEN }}{% endraw %}
    - name: Build and push
      uses: docker/build-push-action@v6
      env:
        DOCKER_BUILDKIT: 1
      with:
        context: .
        push: true
        target: release
        tags: {% raw %}${{ env.REGISTRY }}{% endraw %}/{% raw %}${{ env.IMAGE_NAME }}{% endraw %}:latest,{% raw %}${{ env.REGISTRY }}{% endraw %}/{% raw %}${{ env.IMAGE_NAME }}{% endraw %}:{% raw %}${{ github.sha }}{% endraw %}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: update GitHub Actions — Python 3.12, Postgres 16, action version bumps"
```

---

### Task 9: Update Makefile and bin/ scripts

**Files:**
- Rewrite: `{{cookiecutter.project_name}}/Makefile`
- Modify: `{{cookiecutter.project_name}}/bin/wait-for-psql` (delete or keep)
- Delete: `{{cookiecutter.project_name}}/bin/sops/` — keep if SOPS is still used (it is)

- [ ] **Step 1: Rewrite Makefile**

Replace `{{cookiecutter.project_name}}/Makefile`:

```makefile
.PHONY: dev deps venv docker_build format test freeze clean

# Dev utilities
dev:
	make deps
	bin/dc up -d

deps:
	make venv
	make docker_build
	make frontend_deps

frontend_deps:
	cd frontend && npm install

docker_build:
	bin/dc build

docker_build_clean:
	bin/dc build --no-cache

format:
	ruff format .
	ruff check --fix .

venv:
	uv venv .venv
	uv pip install -e .

precommit:
	make format
	make test
	make freeze

freeze:
	uv pip freeze | grep -vE '^{{cookiecutter.project_name}}' > requirements.freeze.txt

# CI Pipeline & Tests
test:
	pytest

test_backend_coverage:
	pytest --cov={{cookiecutter.project_name}}/apps --cov-config=.coveragerc --cov-report html --cov-report term
	echo "View coverage report: file://$${PWD}/htmlcov/index.html"

# Data management
dump_fixtures:
	bin/djmanage dumpdata --natural-primary --natural-foreign --format json --indent 2 users

clean:
	find . -name '*.pyc' -delete
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: simplify Makefile — ruff only, remove legacy lint tools"
```

---

### Task 10: Clean up pyproject.toml tooling config

**Files:**
- Modify: `{{cookiecutter.project_name}}/pyproject.toml`
- Delete: `{{cookiecutter.project_name}}/.flake8`

- [ ] **Step 1: Simplify pyproject.toml tooling**

Replace the tooling sections in `{{cookiecutter.project_name}}/pyproject.toml` (everything after `[build-system]`):

```toml
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.ruff]
line-length = 120
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]
ignore = ["E501"]

[tool.mypy]
files = ["{{cookiecutter.project_name}}"]
ignore_missing_imports = true

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "{{cookiecutter.project_name}}.settings.test_settings"
python_files = ["test_*.py", "*_test.py"]
addopts = "--ds={{cookiecutter.project_name}}.settings.test_settings"
```

- [ ] **Step 2: Delete .flake8**

```bash
rm -f "{{cookiecutter.project_name}}/.flake8"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: simplify tooling config — ruff replaces black/isort/flake8"
```

---

### Task 11: Update README and clean up stale files

**Files:**
- Rewrite: `{{cookiecutter.project_name}}/README.md`
- Delete: `{{cookiecutter.project_name}}/docker-compose.yml` (old root-level compose, if exists)
- Delete: `{{cookiecutter.project_name}}/{{cookiecutter.project_name}}/utils/views/test_views.py` (if empty/stale)
- Verify: `{{cookiecutter.project_name}}/requirements.freeze.txt` should be regenerated after deps change

- [ ] **Step 1: Rewrite README.md**

Replace `{{cookiecutter.project_name}}/README.md`:

```markdown
# {{cookiecutter.project_name}}

## Quick Start (Zero-Dep Mode)

```bash
# Create virtualenv and install deps
make venv

# Run Django — uses embedded Postgres via pgserver, no Docker needed
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Celery tasks run synchronously in-process (eager mode) when `CELERY_BROKER_URL` is not set.
Media files use local filesystem storage when `S3_ENDPOINT_URL` is not set.

## Full Stack (Docker Compose)

```bash
make dev
```

This starts: Django, Postgres, Redis, Garage (S3), Celery worker, Vite dev server, and Caddy ingress.

Access the app at `http://localhost:{{cookiecutter.development_ingress_port}}`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server with React. Proxies `/api/*` to Django in development.

## Testing

```bash
make test
```

## Formatting

```bash
make format
```
```

- [ ] **Step 2: Delete stale files**

```bash
rm -f "{{cookiecutter.project_name}}/docker-compose.yml"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: update README for modernized stack"
```

---

### Task 12: Update cookiecutter.json and _copy_without_render

**Files:**
- Modify: `cookiecutter.json` (repo root, not inside template)

- [ ] **Step 1: Read and update cookiecutter.json**

Ensure `_copy_without_render` properly excludes files that contain literal `{{` characters that aren't cookiecutter variables (React JSX, GitHub Actions `${{ }}`):

```json
{
    "project_name": "",
    "docker_image_url": "",
    "development_backend_port": "8822",
    "development_frontend_port": "2288",
    "development_ingress_port": "2228",
    "production_hostname": "",
    "author": "",
    "email": "",
    "version": "0.1.0",
    "devops_sops_keys": "",
    "_copy_without_render": [
        "fixtures/",
        "frontend/src/",
        ".github/"
    ]
}
```

- [ ] **Step 2: Commit**

```bash
git add cookiecutter.json
git commit -m "chore: update cookiecutter.json copy_without_render for new frontend paths"
```

---

### Task 13: End-to-end verification

- [ ] **Step 1: Test cookiecutter generation**

```bash
cd /tmp
pip install cookiecutter
cookiecutter /home/linked/p/boundcorp/cookiecutter-django-boundcorp --no-input project_name=testproject docker_image_url=ghcr.io/test/testproject production_hostname=test.example.com author="Test" email="test@example.com"
```

- [ ] **Step 2: Verify zero-dep mode works**

```bash
cd /tmp/testproject
uv venv .venv
source .venv/bin/activate
uv pip install -e .
python manage.py migrate
python manage.py test_healthz_or_check
# At minimum:
python manage.py check
```

Expected: Django system check passes, migrations run against embedded pgserver.

- [ ] **Step 3: Verify tests pass**

```bash
cd /tmp/testproject
source .venv/bin/activate
pytest
```

Expected: All tests pass (health check, profile auth tests).

- [ ] **Step 4: Verify frontend stub works**

```bash
cd /tmp/testproject/frontend
npm install
npm run build
```

Expected: Vite builds successfully.

- [ ] **Step 5: Fix any issues found and commit**

```bash
cd /home/linked/p/boundcorp/cookiecutter-django-boundcorp
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```

- [ ] **Step 6: Clean up temp project**

```bash
rm -rf /tmp/testproject
```
