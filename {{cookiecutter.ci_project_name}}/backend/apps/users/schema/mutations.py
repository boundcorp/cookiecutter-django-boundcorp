import graphene
from django.utils import timezone
from graphene_validator.decorators import validated
from graphql_auth.mutations import (
    ObtainJSONWebToken,
    PasswordChange,
    PasswordReset,
    RefreshToken,
    Register,
    ResendActivationEmail,
    SendPasswordResetEmail,
    UpdateAccount,
    VerifyAccount,
    VerifyToken,
)

from backend.apps.users.models import User

from . import types


class CreateUserInput(graphene.InputObjectType):
    email = graphene.String(required=True)
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)


@validated
class CreateUser(graphene.Mutation):
    class Arguments:
        input = CreateUserInput()

    user = graphene.Field(types.User)

    def mutate(self, info, input):
        user = User.objects.create(
            **input,
            username=input["email"],
            password="",
            created_at=timezone.now().date(),
        )

        return CreateUser(user=user)



class Mutations(object):
    register = Register.Field()
    verify_account = VerifyAccount.Field()
    token_auth = ObtainJSONWebToken.Field()
    verify_token = VerifyToken.Field()
    refresh_token = RefreshToken.Field()
    resend_activation_email = ResendActivationEmail.Field()
    send_password_reset_email = SendPasswordResetEmail.Field()
    password_reset = PasswordReset.Field()
    password_change = PasswordChange.Field()
    update_account = UpdateAccount.Field()

    create_user = CreateUser.Field()
