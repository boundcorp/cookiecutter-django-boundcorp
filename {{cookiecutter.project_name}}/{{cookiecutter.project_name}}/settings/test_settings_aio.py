"""Test settings for running inside Docker with real services.

Usage: pytest --ds={{cookiecutter.project_name}}.settings.test_settings_aio -v

Inherits from test_settings but keeps the env-based settings
(DATABASE_URL, CELERY_BROKER_URL, S3_ENDPOINT_URL) instead of
clearing them for pgserver fallback.
"""
import os

os.environ["TEST_USE_ENV"] = "1"

from {{cookiecutter.project_name}}.settings.test_settings import *  # noqa: E402, F403
