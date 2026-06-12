import pytest
from django.test import Client


@pytest.mark.django_db
def test_healthz(client: Client):
    response = client.get("/api/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True


@pytest.mark.django_db
def test_metrics_endpoint(client: Client):
    client.get("/api/healthz")
    response = client.get("/metrics/")
    assert response.status_code == 200
    body = response.content.decode()
    assert "{{cookiecutter.project_name}}_http_requests_total" in body
    assert 'route="api/healthz"' in body


@pytest.mark.django_db
def test_profile_unauthenticated(client: Client):
    response = client.get("/api/auth/profile")
    assert response.status_code == 401


@pytest.mark.django_db
def test_profile_authenticated(test_user):
    user, client = test_user
    from ninja_jwt.tokens import AccessToken
    token = str(AccessToken.for_user(user))
    response = client.get("/api/auth/profile", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user.email
    assert data["username"] == user.username
