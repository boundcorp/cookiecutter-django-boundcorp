import django.conf
import pytest
from dataclasses import dataclass

from {{cookiecutter.project_name}}.apps.users.factories import UserFactory
from {{cookiecutter.project_name}}.apps.users.models import User


def pytest_configure(config):
    config.addinivalue_line(
        "markers", "has_docker_services: test requires real docker services (postgres, redis, garage)"
    )


def pytest_collection_modifyitems(config, items):
    from django.conf import settings

    if not getattr(settings, "HAS_DOCKER_SERVICES", False):
        skip = pytest.mark.skip(reason="docker services not available (need DATABASE_URL, CELERY_BROKER_URL, S3_ENDPOINT_URL)")
        for item in items:
            if "has_docker_services" in item.keywords:
                item.add_marker(skip)


@pytest.fixture
def strong_pass():
    return "B0undC0rp!!"


@pytest.fixture
def test_user(db, strong_pass, client):
    user = UserFactory(password=strong_pass)
    client.force_login(user)
    return user, client


@dataclass
class ProjectFixture:
    settings: django.conf.Settings
    client: django.test.client.Client
    user: User


@pytest.fixture
def project_fixture_common(db, settings, test_user):
    user, client = test_user
    return ProjectFixture(settings=settings, user=user, client=client)
