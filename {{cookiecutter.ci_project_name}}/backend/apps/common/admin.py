from django.db.models.fields.related import RelatedField


def register(model):
    """
    To make the admin more performant, we ensure all the the relations
    are listed under raw_id_fields
    """

    def decorator(modeladmin):
        raw_id_fields = []
        for field in model._meta.fields:
            if isinstance(field, RelatedField):
                raw_id_fields.append(field.name)
        setattr(modeladmin, "raw_id_fields", raw_id_fields)
        return admin_site.register(model, modeladmin)

    return decorator


from django.contrib.admin import AdminSite
from django.utils.translation import ugettext_lazy


class CustomAdmin(AdminSite):
    # Text to put at the end of each page's <title>.
    site_title = ugettext_lazy("{{cookiecutter.site_title}}")

    # Text to put in each page's <h1> (and above login form).
    site_header = ugettext_lazy("{{cookiecutter.site_header}}")

    # Text to put at the top of the admin index page.
    index_title = ugettext_lazy("Site administration")


admin_site = CustomAdmin()
