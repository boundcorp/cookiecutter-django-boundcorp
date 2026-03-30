from ninja import NinjaAPI
from ninja_jwt.authentication import JWTAuth

api = NinjaAPI(title="{{cookiecutter.project_name}}", version="1.0.0")


@api.get("/healthz")
def healthz(request):
    from django.db import connection
    try:
        connection.ensure_connection()
    except Exception as e:
        return {"status": False, "detail": str(e)}
    return {"status": True}


# Import routers
from {{cookiecutter.project_name}}.api.auth import router as auth_router

api.add_router("/auth/", auth_router)
