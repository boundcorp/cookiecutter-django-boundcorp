from . import auth, logout, profile, register


class Mutations(object):
    token_auth = auth.TokenAuth.Field()
    send_password_reset_email = auth.SendPasswordResetEmail.Field()
    password_reset = auth.PasswordReset.Field()

    logout = logout.Logout.Field()

    update_user_profile = profile.UpdateUserProfile.Field()

    register_business = register.Register.Field()