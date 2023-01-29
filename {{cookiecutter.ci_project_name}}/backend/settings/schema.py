import graphene

import backend.apps.users.schema


class Query(
    backend.apps.users.schema.Queries,
    graphene.ObjectType,
):
    pass


class Mutation(
    backend.apps.users.schema.Mutations,
    graphene.ObjectType,
):
    pass


application_schema = graphene.Schema(query=Query, mutation=Mutation)
