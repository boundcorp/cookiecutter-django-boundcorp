#!/usr/bin/env bash

/app/.venv/bin/python3 manage.py migrate
/app/.venv/bin/uvicorn \
    cheersfinance.asgi:application \
    --host 0.0.0.0 \
    --port 8000
