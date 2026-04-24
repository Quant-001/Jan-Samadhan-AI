from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("materials/", views.MaterialListCreateView.as_view(), name="material-list-create"),
    path("materials/<int:pk>/", views.MaterialDetailView.as_view(), name="material-detail"),
]
