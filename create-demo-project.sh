export NAME="${1:-demo}"
set -eux
if [[ -z "$NAME" ]]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi
echo "Creating project $NAME"
cookiecutter . --no-input \
  project_name=$NAME \
  docker_image_url=ghcr.io/boundcorp/$NAME \
  author="Leeward Bound" \
  email=leeward@boundcorp.net \
  production_hostname=$NAME.boundcorp.net \
  development_backend_port=6677 \
  development_frontend_port=7788 \
  development_ingress_port=7778

mv $NAME ../
echo "Created template in ../$NAME/"
pushd ../$NAME
git init
git add .
echo "git initialized"
direnv allow

source .envrc
bin/dc down || true
make deps
make docker_build
echo "Verifying tests"
source .envrc
make test