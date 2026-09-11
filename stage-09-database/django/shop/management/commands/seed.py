from django.core.management.base import BaseCommand

from shop.seed import ensure_seed


class Command(BaseCommand):
    help = "Load products.json and the admin user into SQLite"

    def handle(self, *args, **options):
        ensure_seed()
        self.stdout.write(self.style.SUCCESS("Seeded products and admin@coral.local"))
