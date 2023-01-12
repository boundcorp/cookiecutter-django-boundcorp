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
