# {{cookiecutter.project_name}}

## Quick Start (Zero-Dep Mode)

    # Create virtualenv and install deps
    make venv

    # Run Django — uses embedded Postgres via pgserver, no Docker needed
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py runserver

Celery tasks run synchronously in-process (eager mode) when `CELERY_BROKER_URL` is not set.
Media files use local filesystem storage when `S3_ENDPOINT_URL` is not set.

## Full Stack (Docker Compose)

    make dev

This starts: Django, Postgres, Redis, Garage (S3), Celery worker, Vite dev server, and Caddy ingress.

Access the app at `http://localhost:{{cookiecutter.development_ingress_port}}`.

## Frontend

    cd frontend
    npm install
    npm run dev

Vite dev server with React. Proxies `/api/*` to Django in development.

## Testing

    make test

## Formatting

    make format
