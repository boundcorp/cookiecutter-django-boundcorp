#!/usr/bin/env bash
set -e
cd $(dirname $0)
NAME="${1:-demo}"

if [[ -z "$NAME" ]]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

[[ -e "$NAME/.envrc" ]] && (cd $NAME && source .envrc && bin/dc down) || true
rm -rf demo || true
sudo rm -rf /data/$NAME || true

./create-test-project.sh $NAME
