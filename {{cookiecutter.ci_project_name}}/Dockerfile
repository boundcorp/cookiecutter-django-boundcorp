ARG image_version=python:3.10.9
ARG node_image=node:14.21.1

#
#
# Base stage
FROM ${image_version}-alpine3.16 as base

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
    libxml2-dev \
    libxslt-dev \
    libressl-dev \
    libffi-dev \
    openssl \
    freetype-dev

RUN pip install --no-cache-dir --upgrade pipenv pip
COPY Pipfile Pipfile.lock /app/

WORKDIR /app
# In production, virtualenv is created in /app/.venv so it can be copied
# to the final image
RUN PIPENV_VENV_IN_PROJECT=true pipenv install --deploy

COPY backend/ /app/backend
COPY manage.py wsgi.py /app/

COPY ./compose/django/*.sh /
RUN chmod +x /*.sh

#
#
# Release-backend
FROM base as release-backend

COPY --from=builder /app /app
COPY --from=builder /*.sh /

RUN apk add --no-cache freetype-dev

RUN mkdir -p /app/frontend

WORKDIR /app
RUN mkdir -p /app/static/uploads && chmod 777 /app/static/uploads
RUN python manage.py collectstatic --noinput

ENTRYPOINT ["/entrypoint.sh"]

#
#
# frontend stages

FROM ${node_image} as frontend-base
#  Base nodejs image

FROM frontend-base as frontend-builder
# builder has node_modules

COPY frontend/package.json /app/frontend/package.json
WORKDIR /app/frontend
RUN yarn install


FROM frontend-builder as frontend
# frontend container has the fully built frontend app, too fat
COPY frontend/ /app/frontend/
RUN yarn && yarn build


#
#
# Release-frontend
FROM frontend-base as release-frontend
# Slimmed down with just the standalone

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=frontend --chown=nextjs:nodejs /app/frontend/.next/standalone /frontend
COPY --from=frontend --chown=nextjs:nodejs /app/frontend/.next/static /frontend/.next/static
COPY --from=frontend --chown=nextjs:nodejs /app/frontend/public /frontend/public
WORKDIR /frontend

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]

#
#
# Developer image stage - ubuntu based instead of alpine
FROM ${image_version} as dev

ENV LANG C.UTF-8
ENV PYTHONUNBUFFERED 1

RUN apt update -yq && apt install -yq netcat

RUN pip install --no-cache-dir --upgrade pipenv pip \
    && mkdir /app

WORKDIR /app

ADD Pipfile Pipfile.lock /app/

# In dev, pipfile is installed with --system, so it persists even if we mount /app from outside
RUN pipenv install --dev --system

COPY compose/django/*.sh /
RUN chmod +x /*.sh

ENTRYPOINT ["/entrypoint.sh"]


#
#
# CI Deployment Container with Helm and Kubectl
FROM kiwigrid/gcloud-kubectl-helm AS deploy
USER root
RUN apk add --no-cache git-crypt

#
#
# This make release-backend the default stage
FROM release-backend
