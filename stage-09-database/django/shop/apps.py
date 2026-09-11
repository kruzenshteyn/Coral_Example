from django.apps import AppConfig
from django.db.models.signals import post_migrate


class ShopConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shop"

    def ready(self):
        def run_seed(sender, **kwargs):
            from .seed import ensure_seed

            ensure_seed()

        post_migrate.connect(run_seed, sender=self)
