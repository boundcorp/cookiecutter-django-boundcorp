from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

router = Router(tags=["auth"])


class UserProfileSchema(Schema):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    account_type: str


@router.get("/profile", auth=JWTAuth(), response=UserProfileSchema)
def profile(request):
    return request.auth
