from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.VerifiedTokenObtainPairView.as_view()),
    path("auth/login/request-otp/", views.LoginRequestOTPView.as_view()),
    path("auth/login/verify-otp/", views.LoginVerifyOTPView.as_view()),
    path("auth/login/resend-otp/", views.ResendLoginOTPView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("auth/verify-email/", views.VerifyEmailView.as_view()),
    path("auth/verify-email/<str:uidb64>/<str:token>/", views.VerifyEmailView.as_view()),
    path("auth/resend-verification/", views.ResendVerificationEmailView.as_view()),

    # Departments
    path("departments/", views.DepartmentListView.as_view()),
    path("departments/<int:pk>/", views.DepartmentDetailView.as_view()),

    # Citizen
    path("complaints/request-otp/", views.ComplaintRequestOTPView.as_view()),
    path("complaints/", views.CitizenComplaintListCreateView.as_view()),
    path("complaints/<int:pk>/", views.CitizenComplaintDetailView.as_view()),
    path("complaints/<int:pk>/feedback/", views.CitizenFeedbackView.as_view()),
    path("track/<str:ticket_id>/", views.track_complaint),
    path("public/stats/", views.public_dashboard_stats),
    path("chatbot/help/", views.chatbot_help),
    path("ai/classify/", views.classify_external_complaint),

    # Admin
    path("admin/complaints/", views.AdminComplaintListView.as_view()),
    path("admin/complaints/<int:pk>/", views.AdminComplaintUpdateView.as_view()),
    path("admin/stats/", views.AdminDashboardStatsView.as_view()),
    path("admin/users/", views.AdminUserListView.as_view()),
    path("admin/create-officer/", views.AdminCreateOfficerView.as_view()),
    path("admin/officers/<int:pk>/", views.AdminOfficerDetailView.as_view()),
    path("admin/departments/", views.AdminDepartmentListCreateView.as_view()),
    path("admin/departments/<int:pk>/", views.AdminDepartmentDetailView.as_view()),

    # Officer
    path("officer/complaints/", views.OfficerComplaintListView.as_view()),
    path("officer/add-complaint/", views.OfficerComplaintCreateView.as_view()),
    path("officer/assignable-officers/", views.OfficerAssignableUsersView.as_view()),
    path("officer/subordinates/", views.OfficerSubordinateCreateView.as_view()),
    path("officer/subordinates/<int:pk>/", views.OfficerSubordinateDetailView.as_view()),
    path("officer/complaints/<int:pk>/", views.OfficerComplaintUpdateView.as_view()),

    # Notifications
    path("notifications/", views.NotificationListView.as_view()),
    path("notifications/<int:pk>/read/", views.mark_notification_read),
]
