ARG IMAGE_VERSION=python:3.10.9-slim

#
# Base Stage
FROM ${IMAGE_VERSION} AS base

# Set environment variables
ENV PATH=/app/.venv/bin:$PATH \
    LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1

RUN mkdir /.cache && chmod -R 777 /.cache

# Install system dependencies
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

# Install Python tools
RUN pip install --no-cache-dir --upgrade pip setuptools poetry uv

# Install bun
RUN curl -fsSL https://bun.sh/install | bash && rm -rf /var/lib/apt/lists/*

ENV PATH=/root/.bun/bin:$PATH


#
# Builder Stage
FROM base AS builder

# Install additional build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat \
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev \
    curl \
    socat \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY requirements.freeze.txt /app/

# Create virtual environment using uv
RUN uv venv /app/.venv

# Install Python dependencies
RUN uv pip install --no-cache-dir -r requirements.freeze.txt

# Install frontend dependencies
RUN mkdir -p /build-frontend
COPY frontend/package.json frontend/bun.lockb /build-frontend/
RUN cd /build-frontend && /root/.bun/bin/bun install

# Move Node.js modules to application directory
# RUN mv /build-frontend/node_modules /app/frontend/

# Copy application code
COPY {{cookiecutter.project_name}}/ /app/{{cookiecutter.project_name}}
COPY infra/ /app/infra
COPY scripts/ /app/scripts
COPY manage.py /app/

#
# Developer Stage
FROM base AS dev

# Set environment variables for development
ENV PYTHONPATH=/app:$PYTHONPATH \
    PYTHONSTARTUP=/app/.pythonrc \
    PYTHONHISTORY=/app/.python_history \
    VIRTUAL_ENV=/venv

# Install development dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat \
    gcc \
    python3-dev \
    libpq-dev \
    libxml2-dev \
    libxslt-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libffi-dev \
    curl \
    socat \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Python tools including uv and Poetry
RUN pip install --no-cache-dir --upgrade pip setuptools poetry uv

# Set working directory
WORKDIR /app

# Create virtual environment using uv
RUN uv venv /venv

# Install Python dependencies
COPY requirements.freeze.txt /app/
RUN uv pip install --no-cache-dir -r requirements.freeze.txt

# Set PATH for Node.js and virtual environment
ENV PATH="/venv/bin:/usr/local/bin:${PATH}"

# Copy application code
COPY {{cookiecutter.project_name}}/ /app/{{cookiecutter.project_name}}
COPY infra/ /app/infra

# Install the application in editable mode
RUN uv pip install -r requirements.freeze.txt

#
# Release Stage
FROM base AS release

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy application from builder
COPY --from=builder /app /app

# Set working directory
WORKDIR /app

# Create directories with appropriate permissions
RUN mkdir -p /app/static/uploads && chmod 777 /app/static/uploads

# Ensure the virtual environment is in PATH
ENV PATH=/app/.venv/bin:$PATH

# Collect static files
RUN python manage.py collectstatic --noinput
