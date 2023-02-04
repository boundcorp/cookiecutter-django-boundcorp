import graphene

import {{cookiecutter.ci_project_name}}.apps.users.schema


class Query(
        {{cookiecutter.ci_project_name}}.apps.users.schema.Queries,
    graphene.ObjectType,
):
    pass


class Mutation(
        {{cookiecutter.ci_project_name}}.apps.users.schema.Mutations,
    graphene.ObjectType,
):
    pass


application_schema = graphene.Schema(query=Query, mutation=Mutation)
