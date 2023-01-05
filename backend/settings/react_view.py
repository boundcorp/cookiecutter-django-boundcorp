from os import environ

from django.contrib.auth import authenticate, login
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


def default_serve_react(request):
    from django.conf import settings


    return render(
        request,
        "react_template.html",
        {
            "ENVIRONMENT": settings.ENVIRONMENT,
        },
    )


@api_view(["POST"])
def login_view(request):
    username = request.data["username"]
    password = request.data["password"]
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
    else:
        return Response({"message": "Login failed"}, status=status.HTTP_401_UNAUTHORIZED)
