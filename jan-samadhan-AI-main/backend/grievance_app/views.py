from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.conf import settings
from django.core import signing
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404

from .ai_service import citizen_help_chat, classify_complaint
from .email_verification import (
    send_complaint_receipt_email,
    send_complaint_status_email,
    send_verification_email,
    verify_email_otp,
    verify_email_token,
)
from .models import User, Department, Complaint, ComplaintHistory, Notification
from .routing import route_complaint_to_department_head
from .serializers import (
    RegisterSerializer, UserSerializer, DepartmentSerializer,
    ComplaintSerializer, ComplaintCreateSerializer, NotificationSerializer,
    AdminComplaintUpdateSerializer, OfficerComplaintUpdateSerializer, CitizenFeedbackSerializer,
)
from .permissions import IsAdmin, IsOfficer, IsCitizen


# ─── Auth ───────────────────────────────────────────────────────────────────


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        verification_required = getattr(settings, "EMAIL_VERIFICATION_REQUIRED", True)
        if verification_required and self.user.role == "CITIZEN" and not self.user.is_verified:
            raise AuthenticationFailed("Please verify your email before signing in.")
        return data


class VerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        email_sent = send_verification_email(user)
        return Response(
            {
                **serializer.data,
                "email_verification_required": getattr(settings, "EMAIL_VERIFICATION_REQUIRED", True),
                "email_sent": email_sent,
                "detail": "Account created. Please enter the OTP sent to your email before signing in.",
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64=None, token=None):
        identifier = request.data.get("identifier") or request.data.get("email")
        otp = request.data.get("otp")
        try:
            user = verify_email_otp(identifier, otp)
        except User.DoesNotExist:
            return Response(
                {"detail": "No citizen account found for this email or username."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.SignatureExpired:
            return Response(
                {"detail": "OTP expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except (ValueError, TypeError, signing.BadSignature):
            return Response(
                {"detail": "Invalid OTP. Please check your email and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_verified:
            user.is_verified = True
        user.email_verification_otp = ""
        user.email_verification_otp_created_at = None
        user.save(update_fields=["is_verified", "email_verification_otp", "email_verification_otp_created_at"])
        return Response({"detail": "Email verified successfully. You can sign in now."})

    def get(self, request, uidb64, token):
        try:
            user = verify_email_token(uidb64, token)
        except (User.DoesNotExist, ValueError, TypeError, signing.BadSignature, signing.SignatureExpired):
            return Response(
                {"detail": "Verification link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_verified:
            user.is_verified = True
        user.email_verification_otp = ""
        user.email_verification_otp_created_at = None
        user.save(update_fields=["is_verified", "email_verification_otp", "email_verification_otp_created_at"])
        return Response({"detail": "Email verified successfully. You can sign in now."})


class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = str(request.data.get("identifier") or request.data.get("email") or "").strip()
        if not identifier:
            return Response(
                {"detail": "Enter your registered email or username."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier),
            role="CITIZEN",
            is_active=True,
        ).first()
        if not user:
            return Response({"detail": "If the account exists, a verification email has been sent."})
        if user.is_verified:
            return Response({"detail": "This email is already verified."})

        email_sent = send_verification_email(user)
        return Response({
            "detail": "Verification OTP sent. Please check your inbox.",
            "email_sent": email_sent,
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Departments ────────────────────────────────────────────────────────────


class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


class DepartmentDetailView(generics.RetrieveAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


class AdminDepartmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return Department.objects.all().select_related("head_officer", "parent_department")

    def perform_create(self, serializer):
        department = serializer.save()
        _sync_department_head(department)


class AdminDepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Department.objects.all()

    def perform_update(self, serializer):
        department = serializer.save()
        _sync_department_head(department)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


# ─── Citizen Complaints ─────────────────────────────────────────────────────


class CitizenComplaintListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user).prefetch_related("history")

    def perform_create(self, serializer):
        if getattr(settings, "EMAIL_VERIFICATION_REQUIRED", True) and not self.request.user.is_verified:
            raise PermissionDenied("Please verify your email before submitting a complaint.")
        complaint = serializer.save(citizen=self.request.user)
        _notify(complaint.citizen, complaint, "ASSIGNED",
                "Complaint Received",
                f"Your complaint #{complaint.ticket_id} has been submitted successfully.")
        receipt_email = str(self.request.data.get("complainant_email") or self.request.user.email or "").strip()
        send_complaint_receipt_email(complaint, receipt_email)
        if complaint.status == "ASSIGNED":
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=None,
                old_status="PENDING",
                new_status="ASSIGNED",
                note=complaint.routing_note or "Complaint routed to department main officer.",
            )
        if complaint.assigned_officer:
            _notify(complaint.assigned_officer, complaint, "ASSIGNED",
                    f"New {complaint.department.name if complaint.department else 'Department'} Complaint",
                    f"Complaint #{complaint.ticket_id} is assigned to your department queue.")


class CitizenComplaintDetailView(generics.RetrieveAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user)


class CitizenFeedbackView(generics.UpdateAPIView):
    serializer_class = CitizenFeedbackSerializer
    permission_classes = [IsAuthenticated, IsCitizen]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user, status="RESOLVED")

    def perform_update(self, serializer):
        complaint = serializer.save()
        ComplaintHistory.objects.create(
            complaint=complaint,
            changed_by=self.request.user,
            note=f"Citizen rated: {complaint.citizen_rating}/5",
        )


# ─── Admin Views ────────────────────────────────────────────────────────────


class AdminComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = Complaint.objects.all().prefetch_related("history")
        status_f = self.request.query_params.get("status")
        dept_f = self.request.query_params.get("department")
        priority_f = self.request.query_params.get("priority")
        search = self.request.query_params.get("search")
        if status_f:
            qs = qs.filter(status=status_f)
        if dept_f:
            qs = qs.filter(department_id=dept_f)
        if priority_f:
            qs = qs.filter(priority=priority_f)
        if search:
            qs = qs.filter(
                Q(ticket_id__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        return qs


class AdminComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = AdminComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Complaint.objects.all()

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        complaint = serializer.save()
        if old_status != complaint.status:
            ComplaintHistory.objects.create(
                complaint=complaint,
                changed_by=self.request.user,
                old_status=old_status,
                new_status=complaint.status,
                note=complaint.admin_override_note,
            )
            _notify(complaint.citizen, complaint, "STATUS_UPDATE",
                    f"Complaint #{complaint.ticket_id} Updated",
                    f"Status changed to {complaint.get_status_display()}")
            send_complaint_status_email(complaint)
        if complaint.assigned_officer:
            _notify(complaint.assigned_officer, complaint, "ASSIGNED",
                    f"New Complaint Assigned: #{complaint.ticket_id}",
                    f"Please review and take action on {complaint.title}")


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total = Complaint.objects.count()
        by_status = dict(Complaint.objects.values_list("status").annotate(c=Count("id")))
        by_priority = dict(Complaint.objects.values_list("priority").annotate(c=Count("id")))
        by_dept = list(
            Complaint.objects.values("department__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        by_category = dict(Complaint.objects.values_list("category").annotate(c=Count("id")))
        avg_rating = Complaint.objects.filter(
            citizen_rating__isnull=False
        ).aggregate(avg=Avg("citizen_rating"))["avg"]
        sla_breached = Complaint.objects.filter(is_sla_breached=True).count()
        return Response({
            "total": total,
            "by_status": by_status,
            "by_priority": by_priority,
            "by_department": by_dept,
            "by_category": by_category,
            "average_rating": round(avg_rating or 0, 2),
            "sla_breached": sla_breached,
            "pending": by_status.get("PENDING", 0),
            "resolved": by_status.get("RESOLVED", 0),
        })


class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        role = self.request.query_params.get("role")
        qs = User.objects.filter(is_active=True)
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminCreateOfficerView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        data = {
            key: str(request.data.get(key, "")).strip()
            for key in [
                "username", "email", "password", "phone", "first_name",
                "last_name", "employee_id", "department_id", "officer_level",
                "supervisor_id", "jurisdiction", "sector", "pin_code",
            ]
        }
        required = ["username", "email", "password", "first_name", "department_id"]
        errors = {
            field: "This field is required."
            for field in required
            if not data.get(field)
        }
        if data.get("username") and User.objects.filter(username__iexact=data["username"]).exists():
            errors["username"] = "Username already exists."
        if data.get("employee_id") and User.objects.filter(employee_id=data["employee_id"]).exists():
            errors["employee_id"] = "Employee ID already exists."
        dept = None
        if data.get("department_id"):
            dept = Department.objects.filter(id=data["department_id"], is_active=True).first()
            if not dept:
                errors["department_id"] = "Select a valid department."
        supervisor = None
        if data.get("supervisor_id"):
            supervisor = User.objects.filter(id=data["supervisor_id"], role="OFFICER", is_active=True).first()
            if not supervisor:
                errors["supervisor_id"] = "Select a valid supervisor."
            elif dept and supervisor.department_id != dept.id:
                errors["supervisor_id"] = "Supervisor must belong to the same department."
        officer_level = "DEPARTMENT_HEAD"
        if data.get("officer_level") and data["officer_level"] != "DEPARTMENT_HEAD":
            errors["officer_level"] = "Admin can only create department main officers."
        if errors:
            return Response({"errors": errors, "error": "Please correct the officer form."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            role="OFFICER",
            phone=data.get("phone", ""),
            department=dept,
            officer_level=officer_level,
            supervisor=supervisor,
            jurisdiction=data.get("jurisdiction", ""),
            sector=data.get("sector", ""),
            pin_code=data.get("pin_code", ""),
            employee_id=data.get("employee_id") or None,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            is_verified=True,
        )
        return Response(UserSerializer(user).data, status=201)


class AdminOfficerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.filter(role="OFFICER")

    def partial_update(self, request, *args, **kwargs):
        officer = self.get_object()
        response = _update_officer_account(
            officer,
            request.data,
            allowed_levels=["DEPARTMENT_HEAD"],
            require_department=True,
        )
        if response:
            return response
        if officer.department_id:
            Department.objects.filter(head_officer=officer).exclude(id=officer.department_id).update(head_officer=None)
            officer.department.head_officer = officer
            officer.department.save(update_fields=["head_officer"])
        return Response(UserSerializer(officer).data)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


# ─── Officer Views ──────────────────────────────────────────────────────────


class OfficerComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return _officer_department_complaints(self.request.user).select_related(
            "department", "assigned_officer", "citizen"
        ).prefetch_related("history")


class OfficerAssignableUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return _assignable_officers_for(self.request.user)


class OfficerSubordinateCreateView(APIView):
    permission_classes = [IsAuthenticated, IsOfficer]

    def post(self, request):
        current = request.user
        if current.officer_level not in ["DEPARTMENT_HEAD", "DEPARTMENT_OFFICER", "SUB_OFFICER"]:
            return Response({"error": "Only main officers, senior officers, and sub officers can add subordinate officers."}, status=status.HTTP_403_FORBIDDEN)
        data = {
            key: str(request.data.get(key, "")).strip()
            for key in [
                "username", "email", "password", "phone", "first_name",
                "last_name", "employee_id", "officer_level", "jurisdiction",
                "sector", "pin_code",
            ]
        }
        allowed_levels = {
            "DEPARTMENT_HEAD": ["DEPARTMENT_OFFICER", "SUB_OFFICER", "FIELD_OFFICER"],
            "DEPARTMENT_OFFICER": ["SUB_OFFICER", "FIELD_OFFICER"],
            "SUB_OFFICER": ["FIELD_OFFICER"],
        }.get(current.officer_level, [])
        errors = {
            field: "This field is required."
            for field in ["username", "email", "password", "first_name"]
            if not data.get(field)
        }
        if data.get("username") and User.objects.filter(username__iexact=data["username"]).exists():
            errors["username"] = "Username already exists."
        if data.get("employee_id") and User.objects.filter(employee_id=data["employee_id"]).exists():
            errors["employee_id"] = "Employee ID already exists."
        officer_level = data.get("officer_level") or allowed_levels[0]
        if officer_level not in allowed_levels:
            errors["officer_level"] = "Select a valid officer level for your hierarchy."
        if errors:
            return Response({"errors": errors, "error": "Please correct the officer form."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            role="OFFICER",
            phone=data.get("phone", ""),
            department=current.department,
            officer_level=officer_level,
            supervisor=current,
            jurisdiction=data.get("jurisdiction", ""),
            sector=data.get("sector", ""),
            pin_code=data.get("pin_code", ""),
            employee_id=data.get("employee_id") or None,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            is_verified=True,
        )
        return Response(UserSerializer(user).data, status=201)


class OfficerSubordinateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return _assignable_officers_for(self.request.user)

    def partial_update(self, request, *args, **kwargs):
        officer = self.get_object()
        allowed_levels = {
            "DEPARTMENT_HEAD": ["DEPARTMENT_OFFICER"],
            "DEPARTMENT_OFFICER": ["SUB_OFFICER"],
            "SUB_OFFICER": ["FIELD_OFFICER"],
        }.get(self.request.user.officer_level, [])
        response = _update_officer_account(
            officer,
            request.data,
            allowed_levels=allowed_levels,
            fixed_department=self.request.user.department,
            fixed_supervisor=self.request.user,
        )
        if response:
            return response
        return Response(UserSerializer(officer).data)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class OfficerComplaintCreateView(generics.CreateAPIView):
    serializer_class = ComplaintCreateSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def perform_create(self, serializer):
        complaint = serializer.save(citizen=self.request.user)
        if self.request.user.department_id:
            complaint.department = self.request.user.department
        if self.request.user.officer_level == "DEPARTMENT_HEAD":
            route_complaint_to_department_head(complaint)
        else:
            complaint.assigned_officer = self.request.user
            complaint.status = "ASSIGNED"
            complaint.routing_note = (
                f"Added by {self.request.user.get_full_name() or self.request.user.username} "
                "and kept in the current officer queue."
            )
            complaint.save(update_fields=["department", "assigned_officer", "status", "routing_note"])


class OfficerComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = OfficerComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsOfficer]

    def get_queryset(self):
        return _officer_department_complaints(self.request.user)

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        next_assignee = serializer.validated_data.get("assigned_officer")
        if (
            next_assignee
            and next_assignee.id != old.assigned_officer_id
            and next_assignee != self.request.user
        ):
            allowed_ids = set(_assignable_officers_for(self.request.user).values_list("id", flat=True))
            if next_assignee.id not in allowed_ids:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only assign complaints to officers below your level in your department.")
        complaint = serializer.save()
        assigned_officer = complaint.assigned_officer
        if assigned_officer and assigned_officer != self.request.user:
            _notify(assigned_officer, complaint, "ASSIGNED",
                    f"Complaint Assigned: #{complaint.ticket_id}",
                    f"{self.request.user.get_full_name() or self.request.user.username} assigned this complaint to you.")
        if complaint.status == "RESOLVED":
            complaint.resolved_at = timezone.now()
            complaint.save(update_fields=["resolved_at"])
        ComplaintHistory.objects.create(
            complaint=complaint,
            changed_by=self.request.user,
            old_status=old_status,
            new_status=complaint.status,
            note=complaint.officer_remarks,
        )
        _notify(complaint.citizen, complaint, "STATUS_UPDATE",
                f"Update on #{complaint.ticket_id}",
                f"Officer updated status to: {complaint.get_status_display()}")
        if old_status != complaint.status:
            send_complaint_status_email(complaint)
        _notify_admins(
            complaint,
            "STATUS_UPDATE",
            f"Officer update on #{complaint.ticket_id}",
            (
                f"{self.request.user.get_full_name() or self.request.user.username} "
                f"updated status to {complaint.get_status_display()}. "
                f"Remarks: {complaint.officer_remarks or 'No remarks added.'}"
            ),
        )


# ─── Notifications ──────────────────────────────────────────────────────────


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
    notif.is_read = True
    notif.save()
    return Response({"status": "ok"})


# ─── Ticket Tracking (public) ───────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def track_complaint(request, ticket_id):
    complaint = get_object_or_404(Complaint, ticket_id=ticket_id.upper())
    return Response({
        "ticket_id": complaint.ticket_id,
        "title": complaint.title,
        "status": complaint.status,
        "priority": complaint.priority,
        "category": complaint.category,
        "department": complaint.department.name if complaint.department else None,
        "assigned_officer": complaint.assigned_officer.get_full_name() if complaint.assigned_officer else None,
        "sector": complaint.sector,
        "pin_code": complaint.pin_code,
        "routing_note": complaint.routing_note,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "sla_deadline": complaint.sla_deadline,
        "is_sla_breached": complaint.is_sla_breached,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_dashboard_stats(request):
    total = Complaint.objects.count()
    resolved = Complaint.objects.filter(status__in=["RESOLVED", "CLOSED"]).count()
    assigned = Complaint.objects.filter(status__in=["ASSIGNED", "IN_PROGRESS", "ESCALATED"]).count()
    pending = Complaint.objects.filter(status__in=["PENDING", "ASSIGNED", "IN_PROGRESS", "ESCALATED"]).count()
    departments = Department.objects.filter(is_active=True).count()
    resolution_percentage = round((resolved / total) * 100, 1) if total else 0
    assigned_percentage = round((assigned / total) * 100, 1) if total else 0
    return Response({
        "total_complaints": total,
        "assigned_complaints": assigned,
        "assigned_percentage": assigned_percentage,
        "resolved_complaints": resolved,
        "pending_complaints": pending,
        "departments": departments,
        "resolution_percentage": resolution_percentage,
    })


# ─── Citizen Help Chatbot ───────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([AllowAny])
def chatbot_help(request):
    message = request.data.get("message", "")
    if not message or not str(message).strip():
        return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(citizen_help_chat(str(message)))


# ─── AI Classification API (for CPGRAMS / State Portal integration) ─────────


@api_view(["POST"])
@permission_classes([AllowAny])
def classify_external_complaint(request):
    title = str(request.data.get("title", "")).strip()
    description = str(request.data.get("description", "")).strip()
    location = str(request.data.get("location", "")).strip()
    external_id = request.data.get("external_complaint_id")

    if not description:
        return Response({"error": "description is required."}, status=status.HTTP_400_BAD_REQUEST)

    text = " ".join(part for part in [title, description, location] if part)
    ai_result = classify_complaint(text)
    category = ai_result.get("category", "OTHER")
    department = Department.objects.filter(code=category, is_active=True).first()

    return Response({
        "external_complaint_id": external_id,
        "category": category,
        "priority": ai_result.get("priority", "LOW"),
        "confidence": ai_result.get("confidence", 0.0),
        "department": department.name if department else "Manual Review",
        "department_code": department.code if department else "OTHER",
        "original_language": ai_result.get("original_lang", "en"),
        "translated_text": ai_result.get("translated_text", text),
        "ai_summary": ai_result.get("summary", description[:120]),
        "routing_mode": "AUTO_ROUTE" if department else "ADMIN_REVIEW",
        "message": "Use this response to route the grievance inside CPGRAMS, a state portal, or Jan Samadhan AI.",
    })


# ─── Helper ─────────────────────────────────────────────────────────────────


def _notify(user, complaint, notif_type, title, message):
    Notification.objects.create(
        recipient=user,
        complaint=complaint,
        notification_type=notif_type,
        title=title,
        message=message,
    )


def _notify_admins(complaint, notif_type, title, message):
    admins = User.objects.filter(role="ADMIN", is_active=True)
    notifications = [
        Notification(
            recipient=admin,
            complaint=complaint,
            notification_type=notif_type,
            title=title,
            message=message,
        )
        for admin in admins
    ]
    Notification.objects.bulk_create(notifications)


def _sync_department_head(department):
    if not department.head_officer_id:
        return
    head = department.head_officer
    head.role = "OFFICER"
    head.department = department
    head.officer_level = "DEPARTMENT_HEAD"
    head.is_verified = True
    head.save(update_fields=["role", "department", "officer_level", "is_verified"])


def _update_officer_account(
    officer,
    data,
    allowed_levels,
    require_department=False,
    fixed_department=None,
    fixed_supervisor=None,
):
    payload = {
        key: str(data.get(key, "")).strip()
        for key in [
            "username", "email", "password", "phone", "first_name", "last_name",
            "employee_id", "department_id", "department", "officer_level",
            "jurisdiction", "sector", "block", "pin_code",
        ]
        if key in data
    }
    errors = {}

    username = payload.get("username")
    if username and User.objects.filter(username__iexact=username).exclude(id=officer.id).exists():
        errors["username"] = "Username already exists."
    employee_id = payload.get("employee_id")
    if employee_id and User.objects.filter(employee_id=employee_id).exclude(id=officer.id).exists():
        errors["employee_id"] = "Employee ID already exists."

    department = fixed_department or officer.department
    department_id = payload.get("department_id") or payload.get("department")
    if fixed_department:
        department = fixed_department
    elif department_id:
        department = Department.objects.filter(id=department_id, is_active=True).first()
        if not department:
            errors["department_id"] = "Select a valid department."
    elif require_department:
        errors["department_id"] = "Department is required."

    officer_level = payload.get("officer_level") or officer.officer_level
    if officer_level and officer_level not in allowed_levels:
        errors["officer_level"] = "Select a valid officer level for this dashboard."

    if errors:
        return Response({"errors": errors, "error": "Please correct the officer form."}, status=status.HTTP_400_BAD_REQUEST)

    for field in ["username", "email", "phone", "first_name", "last_name", "jurisdiction", "sector", "block", "pin_code"]:
        if field in payload:
            setattr(officer, field, payload[field])
    if "employee_id" in payload:
        officer.employee_id = payload["employee_id"] or None
    if "password" in payload and payload["password"]:
        officer.set_password(payload["password"])
    officer.role = "OFFICER"
    officer.department = department
    officer.officer_level = officer_level
    if fixed_supervisor is not None:
        officer.supervisor = fixed_supervisor
    officer.is_verified = True
    officer.is_active = True
    officer.save()
    return None


def _assignable_officers_for(user):
    if not user.department_id:
        return User.objects.none()
    next_level = {
        "DEPARTMENT_HEAD": ["DEPARTMENT_OFFICER"],
        "DEPARTMENT_OFFICER": ["SUB_OFFICER"],
        "SUB_OFFICER": ["FIELD_OFFICER"],
        "FIELD_OFFICER": [],
    }
    allowed = next_level.get(user.officer_level, [])
    if not allowed:
        return User.objects.none()
    direct_chain = User.objects.filter(
        role="OFFICER",
        is_active=True,
        department=user.department,
        supervisor=user,
        officer_level__in=allowed,
    ).exclude(id=user.id)
    if direct_chain.exists():
        return direct_chain
    return User.objects.filter(
        role="OFFICER",
        is_active=True,
        department=user.department,
        officer_level__in=allowed,
        supervisor__isnull=True,
    ).exclude(id=user.id)


def _officer_department_complaints(user):
    if user.department_id:
        return Complaint.objects.filter(department=user.department)
    return Complaint.objects.filter(assigned_officer=user)
