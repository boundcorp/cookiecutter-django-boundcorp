#!/usr/bin/env bash
/app/.venv/bin/celery -A {{cookiecutter.project_name}} beat -l info --schedule=/tmp/{{cookiecutter.project_name}}-celerybeat-schedule
