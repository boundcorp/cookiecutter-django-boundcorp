import graphene
from graphql_jwt.decorators import login_required

from {{cookiecutter.ci_project_name}}.apps.users import filters as f
from {{cookiecutter.ci_project_name}}.apps.users.schema import types
from {{cookiecutter.ci_project_name}}.utils.graphql import FilterInput, define_model_list_query, define_query


class Queries(object):
    @define_query(graphene.Field(types.UserProfile))
    def my_profile(self, info):
        if info.context.user.is_authenticated:
            return info.context.user