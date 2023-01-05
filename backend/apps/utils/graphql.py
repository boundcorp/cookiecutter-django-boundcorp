import re

import graphene


def camelCase_to_snake(input: str):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", input).lower()


def kwargs_from_filterset(fs):
    return {key: graphene.String() for key, _ in fs.get_filters().items()}


def FilterInput(fs):
    return type(
        f"{fs.__name__}Input",
        (graphene.InputObjectType,),
        {key: graphene.String() for key, _ in fs.get_filters().items()},
    )
