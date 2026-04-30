# Kubernetes CI Deployment Guide

A practical guide for the CI-driven Kubernetes deployment pattern used by boundcorp projects (cabal, billables, etc.).

## Overview

Manifests live in the repo under `infra/k8s/`. CI builds and pushes the Docker image to GHCR, then applies manifests directly with `kubectl` and rolls the image tag forward. There is no GitOps controller (no Flux, no ArgoCD) — the CI runner is the deployment agent.

**Flow:**

```
push to main
  → run tests
  → build Docker image → push to ghcr.io/org/project:main-<sha>
  → kubectl apply -f infra/k8s/           (idempotent: creates/updates all resources)
  → kubectl set image deployment/... container=image:tag
  → kubectl rollout status deployment/... --timeout=5m
```

Secrets in the repo are encrypted with SOPS + Age. CI decrypts them at deploy time using a key stored as a GitHub secret.

---

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `KUBECONFIG_OCTO` | Base64-encoded kubeconfig for the target cluster (see below) |
| `GITHUB_TOKEN` | Built-in Actions token — used to push images to GHCR (no setup needed) |
| `GHCR_TOKEN` | A PAT with `read:packages` scope — only needed if a build stage pulls a private base image from GHCR that `GITHUB_TOKEN` can't access |
| `SOPS_AGE_KEY` | The Age private key used to decrypt `secret.sops.yaml` |

`KUBECONFIG_OCTO` is named for the cluster but is just a base64-encoded kubeconfig file. You can target any cluster — rename the secret to match your cluster name for clarity, or keep a single `KUBECONFIG` secret if you only have one cluster. Generate it with:

```bash
base64 -w0 ~/.kube/config
```

For a minimal kubeconfig scoped to a single namespace (recommended), see the RBAC section below.

---

## infra/k8s/ Manifest Structure

```
infra/k8s/
├── kustomization.yaml      # lists all resources; kubectl apply -k reads this
├── namespace.yaml          # Namespace declaration
├── secret.sops.yaml        # SOPS-encrypted Secret (all app env vars)
├── deployment.yaml         # Web/API deployment (includes migrate init container)
├── worker.yaml             # Celery worker deployment
├── frontend.yaml           # Vite frontend deployment + Service (if separate)
├── service.yaml            # ClusterIP Service for the web deployment
├── ingress.yaml            # Ingress with TLS + cert-manager annotations
├── redis.yaml              # Redis Deployment + Service
└── garage.yaml             # Garage (S3-compatible) Deployment + Service (optional)
```

**kustomization.yaml** — lets `kubectl apply -k infra/k8s/` apply everything in one shot:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: myproject
resources:
  - namespace.yaml
  - secret.sops.yaml
  - redis.yaml
  - deployment.yaml
  - service.yaml
  - worker.yaml
  - ingress.yaml
```

**namespace.yaml:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myproject
```

**deployment.yaml** — use an `initContainer` for migrations so they run before the new web pods start accepting traffic:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myproject-web
  namespace: myproject
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myproject-web
  template:
    metadata:
      labels:
        app: myproject-web
    spec:
      imagePullSecrets:
        - name: ghcr-secret
      initContainers:
        - name: migrate
          image: ghcr.io/org/myproject:latest    # kubectl set image updates this
          command: ["python", "manage.py", "migrate", "--noinput"]
          envFrom:
            - secretRef:
                name: myproject-secret
          env:
            - name: DJANGO_SETTINGS_MODULE
              value: myproject.settings
      containers:
        - name: web
          image: ghcr.io/org/myproject:latest    # kubectl set image updates this
          command: ["uvicorn", "asgi:application", "--host", "0.0.0.0", "--port", "8000"]
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: myproject-secret
          env:
            - name: DJANGO_SETTINGS_MODULE
              value: myproject.settings
            - name: ALLOWED_HOSTS
              value: "myproject.example.com"
          livenessProbe:
            httpGet:
              path: /api/healthz
              port: 8000
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/healthz
              port: 8000
            periodSeconds: 10
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 512Mi
```

**worker.yaml** — Celery worker with graceful shutdown:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myproject-worker
  namespace: myproject
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myproject-worker
  template:
    metadata:
      labels:
        app: myproject-worker
    spec:
      terminationGracePeriodSeconds: 300   # allow running tasks to finish
      imagePullSecrets:
        - name: ghcr-secret
      containers:
        - name: worker
          image: ghcr.io/org/myproject:latest
          command: ["celery", "-A", "myproject", "worker", "-l", "info"]
          envFrom:
            - secretRef:
                name: myproject-secret
          env:
            - name: DJANGO_SETTINGS_MODULE
              value: myproject.settings
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 1Gi
```

---

## SOPS Secret Handling

Secrets are stored encrypted in `infra/k8s/secret.sops.yaml` and committed to the repo. The file is a normal Kubernetes `Secret` manifest, but the values under `stringData` are encrypted with Age.

### Initial setup

```bash
# Install sops
brew install sops      # or: apt install sops

# Generate an age key pair (once per team/project)
age-keygen -o key.txt
# Prints: Public key: age1...
# key.txt contains the private key — store it as the SOPS_AGE_KEY GitHub secret

# Create a .sops.yaml in the repo root to configure encryption
cat > .sops.yaml <<'EOF'
creation_rules:
  - path_regex: infra/k8s/secret\.sops\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: age1...   # paste the public key here
EOF
```

### Creating/editing the encrypted secret

```bash
# Create a plaintext secret.yaml first
cat > /tmp/secret.yaml <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: myproject-secret
  namespace: myproject
type: Opaque
stringData:
  SECRET_KEY: "your-django-secret-key"
  DATABASE_URL: "postgres://user:pass@host:5432/dbname"
  CELERY_BROKER_URL: "redis://redis:6379/0"
EOF

# Encrypt it
export SOPS_AGE_KEY_FILE=key.txt
sops --encrypt /tmp/secret.yaml > infra/k8s/secret.sops.yaml

# Edit an already-encrypted file
sops infra/k8s/secret.sops.yaml
```

The encrypted file looks like this (safe to commit):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myproject-secret
  namespace: myproject
type: Opaque
stringData:
  SECRET_KEY: ENC[AES256_GCM,data:...,type:str]
  DATABASE_URL: ENC[AES256_GCM,data:...,type:str]
sops:
  age:
    - recipient: age1...
      enc: |
        -----BEGIN AGE ENCRYPTED FILE-----
        ...
        -----END AGE ENCRYPTED FILE-----
  encrypted_regex: ^(data|stringData)$
  version: 3.9.1
```

---

## The CI Deploy Job

Full example combining the cabal and billables patterns:

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set image tag
        run: echo "TAG=main-${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          target: release
          push: true
          tags: |
            ghcr.io/org/myproject:${{ env.TAG }}
            ghcr.io/org/myproject:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set image tag
        run: echo "TAG=main-${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Install kubectl
        uses: azure/setup-kubectl@v4

      - name: Configure kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBECONFIG_OCTO }}" | base64 -d > ~/.kube/config
          chmod 600 ~/.kube/config

      - name: Install sops
        run: |
          curl -Lo sops https://github.com/getsops/sops/releases/download/v3.9.1/sops-v3.9.1.linux.amd64
          chmod +x sops
          sudo mv sops /usr/local/bin/sops

      - name: Decrypt and apply secret
        env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
        run: |
          sops --decrypt infra/k8s/secret.sops.yaml | kubectl apply -f -

      - name: Apply manifests (except secret)
        run: |
          kubectl apply -f infra/k8s/namespace.yaml
          kubectl apply -f infra/k8s/redis.yaml
          kubectl apply -f infra/k8s/deployment.yaml
          kubectl apply -f infra/k8s/service.yaml
          kubectl apply -f infra/k8s/worker.yaml
          kubectl apply -f infra/k8s/ingress.yaml

      - name: Update image tags
        run: |
          kubectl -n myproject set image deployment/myproject-web \
            web=ghcr.io/org/myproject:${TAG} \
            migrate=ghcr.io/org/myproject:${TAG}
          kubectl -n myproject set image deployment/myproject-worker \
            worker=ghcr.io/org/myproject:${TAG}

      - name: Wait for rollout
        run: |
          kubectl -n myproject rollout status deployment/myproject-web --timeout=5m
          kubectl -n myproject rollout status deployment/myproject-worker --timeout=5m
```

### Why apply the secret separately from the other manifests

`kubectl apply -k` (kustomize) can't decrypt SOPS in-flight — it would apply the encrypted YAML as-is. So the pattern is:

1. Decrypt the secret with `sops --decrypt` and pipe to `kubectl apply -f -`
2. Apply the remaining manifests directly (`kubectl apply -f` per file, or `apply -k` with the secret removed from `kustomization.yaml`)

Alternatively, install `helm-secrets` or the `kustomize-sops` plugin if you want a single `kubectl apply -k` step — but the manual pipe is simpler for CI.

### Why `set image` after `apply`

`kubectl apply -f deployment.yaml` only updates the image if the YAML changed. Since the YAML in the repo has a pinned tag (e.g. `main-c2307a0`), it won't update on every push unless you edit the file each time. The `set image` step surgically patches the running deployment to the new SHA tag without requiring a YAML edit.

---

## RBAC / Kubeconfig Notes

The `KUBECONFIG_OCTO` secret is a base64-encoded kubeconfig. It can point to any cluster — the name `OCTO` just identifies which cluster this project deploys to. If you have one cluster, call it whatever makes sense.

### Scoped service account (recommended over admin kubeconfig)

Rather than storing an admin kubeconfig, create a namespace-scoped service account with only the permissions CI needs:

```bash
# Create service account and role in the target namespace
kubectl -n myproject apply -f - <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ci-deployer
  namespace: myproject
---
apiVersion: v1
kind: Secret
metadata:
  name: ci-deployer-token
  namespace: myproject
  annotations:
    kubernetes.io/service-account.name: ci-deployer
type: kubernetes.io/service-account-token
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ci-deployer-role
  namespace: myproject
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-binding
  namespace: myproject
subjects:
  - kind: ServiceAccount
    name: ci-deployer
    namespace: myproject
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ci-deployer-role
EOF
```

Then extract a minimal kubeconfig scoped to that service account:

```bash
# Get the token
TOKEN=$(kubectl -n myproject get secret ci-deployer-token -o jsonpath='{.data.token}' | base64 -d)
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CA=$(kubectl -n myproject get secret ci-deployer-token -o jsonpath='{.data.ca\.crt}')

# Build a minimal kubeconfig
cat > kubeconfig-ci.yaml <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: myproject
    cluster:
      server: ${SERVER}
      certificate-authority-data: ${CA}
contexts:
  - name: myproject
    context:
      cluster: myproject
      user: ci-deployer
      namespace: myproject
current-context: myproject
users:
  - name: ci-deployer
    user:
      token: ${TOKEN}
EOF

# Base64-encode and store as KUBECONFIG_OCTO (or whatever you name it)
base64 -w0 kubeconfig-ci.yaml
```

Copy the output into the GitHub secret. The `chmod 600` in the CI step is required — kubectl refuses to use a world-readable kubeconfig.

### Pulling private images from GHCR

Pods need an image pull secret to pull from `ghcr.io/org/...`. Create it once per namespace:

```bash
kubectl -n myproject create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_PAT_WITH_READ_PACKAGES
```

Reference it in every Deployment's pod spec:

```yaml
spec:
  imagePullSecrets:
    - name: ghcr-secret
```

---

## First-Time Cluster Bootstrap

On a brand-new cluster, some resources must exist before the manifests can apply cleanly:

1. **cert-manager** — for automatic TLS via Let's Encrypt (`cert-manager.io/cluster-issuer` annotation on Ingress)
2. **ingress-nginx** — the Ingress controller
3. **KEDA** (optional) — only if you use `ScaledObject` for autoscaling workers based on queue depth
4. **ghcr-secret** in the target namespace — image pull secret (see above)
5. **ClusterIssuer** — cert-manager issuer pointing at Let's Encrypt

Install cert-manager and ingress-nginx via Helm before the first deploy:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set crds.enabled=true
```

---

## Troubleshooting

**Rollout stuck / pods CrashLoopBackOff:**
```bash
kubectl -n myproject get pods
kubectl -n myproject logs deployment/myproject-web -c migrate   # check migration logs
kubectl -n myproject describe pod <pod-name>
```

**Secret not decrypting:**
```bash
# Test locally
SOPS_AGE_KEY="$(cat key.txt)" sops --decrypt infra/k8s/secret.sops.yaml
```

**Image pull errors:**
```bash
kubectl -n myproject get events --sort-by='.lastTimestamp' | tail -20
# Usually means ghcr-secret is missing or expired
```

**Rollout status timeout:**
The `--timeout=5m` is a CI guard. If migrations take longer than expected, increase it. Check logs on the `migrate` init container before assuming the deployment itself is broken.
