#!/usr/bin/env bash

make frontend_deps
make generate
python3 manage.py runserver --port 8000 --host 0.0.0.0