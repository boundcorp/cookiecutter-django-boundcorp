import graphene
from graphene_django import DjangoObjectType
from graphql_auth.models import UserStatus

from backend.apps.users import models


class UserProfile(DjangoObjectType):
    verified = graphene.Boolean()

    def resolve_verified(parent, info):
        return UserStatus.objects.get(user_id=parent.id).verified


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

