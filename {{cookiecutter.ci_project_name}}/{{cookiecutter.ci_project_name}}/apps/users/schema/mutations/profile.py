import graphene

from {{cookiecutter.ci_project_name}}.apps.users.models import User
from {{cookiecutter.ci_project_name}}.apps.users.schema.types import UserProfile
from {{cookiecutter.ci_project_name}}.utils.graphql import Error, success_or_error
from {{cookiecutter.ci_project_name}}.utils.graphql.validator.decorators import validated
from {{cookiecutter.ci_project_name}}.utils.models import get_input_fields


class UpdateUserProfileInput(graphene.InputObjectType):
    first_name = graphene.String()
    last_name = graphene.String()
    email = graphene.String()


class UpdateUserProfileSuccess(graphene.ObjectType):
    user = graphene.Field(UserProfile)


@validated
class UpdateUserProfile(graphene.Mutation):
    class Arguments:
        input = UpdateUserProfileInput()

    Output = success_or_error(UpdateUserProfileSuccess)

    def mutate(self, info, input):
        user = info.context.user

        try:
            fields = get_input_fields(User, input)
            fields["username"] = fields["email"].strip().lower()
            User.objects.filter(id=user.id).update(**fields)

            user.refresh_from_db()

            return UpdateUserProfileSuccess(user=user)

        except Exception as e:
            return Error(message=e)