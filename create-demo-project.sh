export NAME="${1:-demo}"
set -eux
if [[ -z "$NAME" ]]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi
echo "Creating project $NAME"
cookiecutter . --no-input \
  ci_project_name=$NAME \
  ci_project_path=boundcorp/$NAME \
  author="Leeward Bound" \
  email=leeward@boundcorp.net \
  production_hostname=$NAME.boundcorp.net \
  development_backend_port=8877 \
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
bin/setup.dev
echo "Verifying tests"
source .envrc
make test
echo "Installing deps"
make deps
echo "Verifying repository"
make precommit
echo "Building release"
bin/build release
