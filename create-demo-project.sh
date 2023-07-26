export NAME="${1:-demo}"
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
  development_backend_port=8811 \
  development_ingress_port=1118 \
  development_frontend_port=1188

echo "Created template in $NAME/"
pushd $NAME
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
