import graphene
from graphql_jwt.decorators import login_required

from backend.apps.common.graphql_helpers import define_model_list_query, define_query
from backend.apps.users import filters as f
from backend.apps.users.schema import types
from backend.apps.utils.graphql import FilterInput


class Queries(object):
    @define_query(graphene.Field(types.User))
    def my_profile(self, info):
        if info.context.user.is_authenticated:
            return info.context.user

    @define_model_list_query(types.User, filters=FilterInput(f.UserFilterSet))
    @login_required
    def get_users(self, info, filters=None):
        if not filters:
            filters = {}

        return f.UserFilterSet(filters).qs