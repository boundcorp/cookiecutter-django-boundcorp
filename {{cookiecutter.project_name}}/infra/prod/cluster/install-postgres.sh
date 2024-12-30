#!/usr/bin/env bash

helm upgrade --install postgres oci://registry-1.docker.io/bitnamicharts/postgresql \
    --set auth.postgresPassword={{cookiecutter.project_name}} \
    --set auth.database={{cookiecutter.project_name}} \
    --set auth.username={{cookiecutter.project_name}} \
    --set auth.password={{cookiecutter.project_name}} \
    --set auth.rootPassword={{cookiecutter.project_name}} \
    --set primary.persistence.enabled=true \
    --set primary.persistence.size=1Gi
