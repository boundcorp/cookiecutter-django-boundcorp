import graphene
from graphene_django import DjangoObjectType
from graphql_auth.models import UserStatus

from {{cookiecutter.ci_project_name}}.apps.users import models


class UserProfile(DjangoObjectType):
    class Meta:
        model = models.User
        fields = [
            "id",
            "is_staff",
            "email",
            "username",
            "first_name",
            "last_name",
        ]

