import json
from dataclasses import dataclass
from typing import Callable, Optional, Mapping, Any

import django.conf
import pytest
from graphql_jwt.shortcuts import get_token
from pytest_django.lazy_django import skip_if_no_django

from {{cookiecutter.project_name}}.apps.users.factories import UserFactory
from {{cookiecutter.project_name}}.apps.users.models import User

GRAPHQL_ENDPOINT = '/api/graphql/'


@pytest.fixture
def strong_pass():
    # Test password is very strong
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

