from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "ADMIN"


class IsOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "OFFICER"


class IsCitizen(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CITIZEN"


class IsAdminOrOfficer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("ADMIN", "OFFICER")
