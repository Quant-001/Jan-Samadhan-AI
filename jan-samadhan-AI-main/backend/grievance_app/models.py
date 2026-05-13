from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.conf import settings
import uuid


class User(AbstractUser):
    ROLE_CHOICES = [
        ("CITIZEN", "Citizen"),
        ("ADMIN", "Admin"),
        ("OFFICER", "Officer"),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="CITIZEN")
    OFFICER_LEVEL_CHOICES = [
        ("MAIN_OFFICER", "Main Officer"),
        ("DEPARTMENT_HEAD", "Department-Wise Main Officer"),
        ("DEPARTMENT_OFFICER", "Department Officer"),
        ("SUB_OFFICER", "Sub Officer"),
        ("FIELD_OFFICER", "Sub-Section / Field Officer"),
    ]
    phone = models.CharField(max_length=15, blank=True)
    department = models.ForeignKey(
        "Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="officers"
    )
    officer_level = models.CharField(
        max_length=30, choices=OFFICER_LEVEL_CHOICES, blank=True, default=""
    )
    supervisor = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="sub_officers"
    )
    jurisdiction = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=80, blank=True)
    block = models.CharField(max_length=80, blank=True, default="")
    pin_code = models.CharField(max_length=10, blank=True)
    employee_id = models.CharField(max_length=30, blank=True, unique=True, null=True)
    is_verified = models.BooleanField(default=False)
    email_verification_otp = models.CharField(max_length=6, blank=True)
    email_verification_otp_created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "User"

    def __str__(self):
        return f"{self.username} ({self.role})"


class Department(models.Model):
    GOVERNMENT_LEVEL_CHOICES = [
        ("STATE", "State Government"),
        ("CENTRAL", "Central Government"),
        ("LOCAL", "Local Body"),
    ]
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    government_level = models.CharField(
        max_length=20, choices=GOVERNMENT_LEVEL_CHOICES, default="STATE"
    )
    description = models.TextField(blank=True)
    parent_department = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="sub_departments"
    )
    head_officer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="headed_departments"
    )
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Complaint(models.Model):
    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("CRITICAL", "Critical"),
    ]
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ASSIGNED", "Assigned"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
        ("ESCALATED", "Escalated"),
        ("REJECTED", "Rejected"),
    ]
    CATEGORY_CHOICES = [
        ("ELECTRICITY", "Electricity"),
        ("WATER", "Water Supply"),
        ("SANITATION", "Sanitation"),
        ("ROADS", "Roads & Infrastructure"),
        ("PUBLIC_SERVICES", "Public Services"),
        ("HEALTH", "Health"),
        ("EDUCATION", "Education"),
        ("OTHER", "Other"),
    ]

    ticket_id = models.CharField(max_length=20, unique=True, editable=False)
    citizen = models.ForeignKey(User, on_delete=models.CASCADE, related_name="complaints")
    complainant_name = models.CharField(max_length=120, blank=True)
    complainant_email = models.EmailField(blank=True)
    valid_id_number = models.CharField(max_length=80, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    original_language = models.CharField(max_length=20, default="en")
    translated_description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="OTHER")
    ai_category = models.CharField(max_length=30, blank=True)
    ai_confidence = models.FloatField(default=0.0)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="LOW")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="PENDING")
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="complaints"
    )
    assigned_officer = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_complaints"
    )
    location = models.CharField(max_length=255, blank=True)
    sector = models.CharField(max_length=80, blank=True)
    pin_code = models.CharField(max_length=10, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    attachment = models.FileField(upload_to="complaints/attachments/", blank=True, null=True)
    proof_of_resolution = models.FileField(upload_to="complaints/proofs/", blank=True, null=True)
    officer_remarks = models.TextField(blank=True)
    admin_override_note = models.TextField(blank=True)
    routing_note = models.TextField(blank=True)
    sla_deadline = models.DateTimeField(null=True, blank=True)
    is_sla_breached = models.BooleanField(default=False)
    citizen_rating = models.IntegerField(null=True, blank=True)
    citizen_feedback = models.TextField(blank=True)
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="duplicates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = self._generate_ticket_id()
        if not self.sla_deadline and self.priority:
            hours = settings.SLA_HOURS.get(self.priority, 168)
            self.sla_deadline = timezone.now() + timezone.timedelta(hours=hours)
        super().save(*args, **kwargs)

    def _generate_ticket_id(self):
        import random, string
        prefix = "JS"
        rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        return f"{prefix}{rand}"

    def __str__(self):
        return f"{self.ticket_id} — {self.title[:50]}"

    class Meta:
        ordering = ["-created_at"]


class ComplaintHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="history")
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    old_status = models.CharField(max_length=15, blank=True)
    new_status = models.CharField(max_length=15, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.complaint.ticket_id}: {self.old_status} → {self.new_status}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ("ASSIGNED", "Complaint Assigned"),
        ("STATUS_UPDATE", "Status Updated"),
        ("SLA_BREACH", "SLA Breached"),
        ("ESCALATION", "Escalated"),
        ("RESOLVED", "Resolved"),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} → {self.recipient.username}"
