ARG image_version=python:3.8.5-alpine3.12
ARG node_image=node:14.17.1

#
#
# Base stage
FROM ${image_version} as base

ENV PATH=/app/.venv/bin:$PATH
ENV LANG=C.UTF-8
ENV PYTHONUNBUFFERED=1

# Fix for psycopg2 ssl loading error
# https://stackoverflow.com/questions/60588431/psycopg2-import-error-ssl-check-private-key-symbol-not-found
ENV LD_PRELOAD=/lib/libssl.so.1.1

RUN apk add --no-cache \
    libpq \
    libjpeg \
    libcurl \
    bash \
    libxml2-dev \
    libxslt-dev \
    curl-dev \
    build-base

#
#
# Builder stage
FROM base as builder

RUN apk add --no-cache \
    zlib-dev \
    jpeg-dev \
    gcc \
    python3-dev \
    musl-dev \
    postgresql-dev \
    linux-headers \
    build-base \
    libcurl \
    curl-dev \
    libressl-dev \
    libxml2-dev \
    libxslt-dev \
    libffi-dev \
    openssl \
    freetype-dev

RUN pip install --no-cache-dir --upgrade pipenv pip
COPY Pipfile Pipfile.lock /app/

WORKDIR /app
RUN PIPENV_VENV_IN_PROJECT=true pipenv install --deploy

COPY backend/ /app/backend
COPY manage.py wsgi.py /app/

# Needed for fixtures to run in e2e tests
COPY fixtures/ /app/fixtures

COPY ./compose/django/*.sh /
RUN chmod +x /*.sh


#
#
# frontend stage
FROM ${node_image} as frontend-builder

COPY frontend/package.json /app/frontend/package.json
WORKDIR /app/frontend
RUN yarn install


FROM frontend-builder as frontend
COPY frontend/ /app/frontend/
RUN yarn && yarn build

#
#
# Release stage
FROM base as release

COPY --from=builder /app /app
COPY --from=builder /*.sh /

RUN apk add --no-cache freetype-dev

RUN mkdir -p /app/frontend

COPY --from=frontend /app/frontend/build /app/frontend/build
COPY --from=frontend /app/frontend/webpack-stats.json /app/frontend/webpack-stats.json

WORKDIR /app
RUN mkdir -p /app/static/uploads && chmod 777 /app/static/uploads
RUN python manage.py collectstatic --noinput

ENTRYPOINT ["/entrypoint.sh"]

#
#
# Developer image stage

FROM builder as dev

# copy in test dependencies
COPY pytest.ini pyproject.toml /app/
COPY fixtures/ /app/fixtures

WORKDIR /app
RUN PIPENV_VENV_IN_PROJECT=true pipenv install --dev

ENTRYPOINT ["/entrypoint.sh"]


#
#
# CI Deployment Container with Helm and Kubectl
FROM kiwigrid/gcloud-kubectl-helm AS deploy
USER root
RUN apk add --no-cache git-crypt

#
#
# This make release the default stage
FROM release
