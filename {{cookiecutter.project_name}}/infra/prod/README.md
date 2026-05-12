# Production Infra

Production deploys via the `bjw-s/app-template` Helm chart and the values files at the repo root.

The Django image is deployed three times with different commands:

- `main` runs `infra/prod/start-uvicorn.sh`
- `celery` runs `infra/prod/start-celery-worker.sh`
- `beat` runs `infra/prod/start-celery-beat.sh`

This split is required for any project that uses asynchronous jobs plus `CELERY_BEAT_SCHEDULE`. Do not background a worker inside the web pod; web, worker, and beat must be independently restartable and observable.

## First-time setup

1. Provision cluster dependencies like PostgreSQL and ingress from `infra/prod/cluster/`.
2. Encrypt and commit `helm-values.staging.secrets.yaml` and `helm-values.production.secrets.yaml` with SOPS.
3. Ensure the deploy kubeconfigs and SOPS age key are present in GitHub Actions secrets.

## Deploy flow

1. `deploy-staging.yml` runs on PRs and calls `bin/helm-deploy <sha> staging`.
2. `deploy-production.yml` runs on `main` and calls `bin/helm-deploy <sha> production`.
3. `bin/helm-deploy` pins the same image tag onto the `main`, `celery`, and `beat` controllers.

When you add a periodic task, update the app schedule and confirm the `beat` controller still exists in both values files.
