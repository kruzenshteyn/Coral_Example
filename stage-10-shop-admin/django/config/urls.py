from django.urls import include, path
from shop import views

urlpatterns = [
    path("api/", include("shop.urls")),
    path("assets/<path:path>", views.asset_file),
    path("", views.frontend_file),
    path("<path:path>", views.frontend_file),
]
