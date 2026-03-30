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
    libcairo2-dev \
    pkg-config \
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
COPY pyproject.toml /app/
RUN uv pip install -e .

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
    libcairo2-dev \
    pkg-config \
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
