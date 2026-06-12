#!/usr/bin/env bash
/app/.venv/bin/celery -A {{cookiecutter.project_name}} worker -l info
