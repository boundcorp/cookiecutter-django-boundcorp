import graphene
from django.utils import timezone

from {{cookiecutter.ci_project_name}}.apps.users.models import AccountTypes, User
from {{cookiecutter.ci_project_name}}.apps.users.schema.types import UserProfile
from {{cookiecutter.ci_project_name}}.utils.graphql import Error, success_or_error
from {{cookiecutter.ci_project_name}}.utils.graphql.validator.decorators import validated


class RegisterInput(graphene.InputObjectType):
    email = graphene.String(required=True)
    password = graphene.String(required=True)
    password_confirm = graphene.String(required=True)
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)


class RegisterSuccess(graphene.ObjectType):
    user = graphene.Field(UserProfile)


@validated
class Register(graphene.Mutation):
    class Arguments:
        input = RegisterInput()

    Output = success_or_error(RegisterSuccess)

    def mutate(self, info, input):
        if input["password"] != input["password_confirm"]:
            return Error(message="Your passwords must match.")
        try:
            email = input["email"].strip().lower()
            user = User.objects.create(
                username=email,
                email=email,
                password="",
                created_at=timezone.now().date(),
                is_active=False,  # All Accounts Inactive During Pre-release
                is_staff=False,
                is_superuser=False,
                account_type=AccountTypes.USER,
                first_name=input["first_name"],
                last_name=input["last_name"],
            )
            user.set_password(input["password"])
            user.save()


            return RegisterSuccess(user=user)
        except Exception as e:
            return Error(message=e)