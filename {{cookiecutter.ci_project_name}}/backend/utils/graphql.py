import re
from typing import Union

import graphene
from graphene_validator.errors import SingleValidationError


def define_model_list_query(return_type: graphene.Field, **arguments):
    def wrap(func):
        return _define_query(
            func,
            graphene.Field(
                graphene.List(graphene.NonNull(return_type), required=True),
                **{k: graphene.Argument(v) for k, v in arguments.items()},
            ),
        )

    return wrap


def define_query(return_type: Union[graphene.Field, graphene.List]):
    def wrap(func):
        return _define_query(func, return_type)

    return wrap


class _define_query:
    def __init__(self, fn, return_type):
        self.fn = fn
        self.return_type = return_type

    def __set_name__(self, owner, name):
        # do something with owner, i.e.
        self.fn.class_name = owner.__name__

        # then replace ourself with the original method
        setattr(owner, f"resolve_{name}", self.fn)
        setattr(owner, name, self.return_type)


def create_validation_error(code: str, message: str):
    return type(code, (SingleValidationError,), {"meta": property(lambda self: {"message": message})})


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


class IError(graphene.Interface):
    message = graphene.String(required=True)


class IFieldError(graphene.Interface):
    field = graphene.String(required=True)


class Error(graphene.ObjectType):
    message = graphene.String(required=True)

    class Meta:
        implements = (IError,)


class FieldError(graphene.ObjectType):
    message = graphene.String(required=True)
    field = graphene.String(required=True)

    class Meta:
        implements = (IFieldError,)


def union_type(type_name, *union_types):
    class ResultUnion(graphene.Union):
        class Meta:
            types = (*union_types,)
            name = type_name

    return ResultUnion


def success_or_error(cls, *error_types, name=None):
    if not name:
        success_name = cls.__name__
        if not success_name.endswith("Success") or not issubclass(cls, graphene.ObjectType):
            raise NameError(
                "You can only use the success_or_errors helper with an ObjectType that's name ends with Success"
            )
        name = success_name[:-7]
        if not name.endswith("Result"):
            name += "Result"

    types = list(error_types) + [
        Error,
    ]

    return union_type(name, cls, *types)
