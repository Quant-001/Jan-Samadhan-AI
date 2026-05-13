from urllib.parse import quote
import random

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes

from .models import User


EMAIL_VERIFICATION_SALT = "grievance_app.email_verification"


def make_email_verification_otp(user):
    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    user.email_verification_otp = otp
    user.email_verification_otp_created_at = timezone.now()
    user.save(update_fields=["email_verification_otp", "email_verification_otp_created_at"])
    return otp


def make_email_verification_token(user):
    return signing.dumps(
        {"user_id": user.pk, "email": user.email},
        salt=EMAIL_VERIFICATION_SALT,
    )


def make_email_verification_link(user):
    token = make_email_verification_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{frontend_url}/verify-email/{uidb64}/{quote(token, safe='')}"


def send_verification_email(user):
    if not user.email:
        return False

    otp = make_email_verification_otp(user)
    verification_link = make_email_verification_link(user)
    subject = "Verify your Jan Samadhan AI email"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "Please verify your email address before submitting a complaint on Jan Samadhan AI.\n\n"
        f"Your OTP is: {otp}\n"
        "Enter this OTP on the verification page to activate your citizen account.\n\n"
        "You can also verify using this link:\n"
        f"Verify email: {verification_link}\n\n"
        "This OTP/link will expire automatically."
    )
    return send_portal_email(subject, message, [user.email])


def send_complaint_receipt_email(complaint, recipient_email=None):
    email = recipient_email or complaint.citizen.email
    if not email:
        return False

    subject = f"Complaint submitted: #{complaint.ticket_id}"
    message = (
        f"Hello {complaint.complainant_name or complaint.citizen.first_name or complaint.citizen.username},\n\n"
        "Your complaint has been submitted successfully on Jan Samadhan AI.\n\n"
        f"Tracking ID: {complaint.ticket_id}\n"
        f"Title: {complaint.title}\n"
        f"Status: {complaint.get_status_display()}\n"
        f"Priority: {complaint.get_priority_display()}\n\n"
        f"Location: {complaint.location or 'Not provided'}\n"
        f"Department: {complaint.department.name if complaint.department else 'Admin review'}\n\n"
        "You can sign in to your citizen dashboard to track updates."
    )
    return send_portal_email(subject, message, [email])


def send_complaint_status_email(complaint, recipient_email=None):
    email = recipient_email or complaint.complainant_email or complaint.citizen.email
    if not email:
        return False

    subject = f"Complaint status update: #{complaint.ticket_id}"
    message = (
        f"Hello {complaint.complainant_name or complaint.citizen.first_name or complaint.citizen.username},\n\n"
        "Your Jan Samadhan AI complaint status has been updated.\n\n"
        f"Tracking ID: {complaint.ticket_id}\n"
        f"Title: {complaint.title}\n"
        f"Status: {complaint.get_status_display()}\n"
        f"Priority: {complaint.get_priority_display()}\n"
        f"Department: {complaint.department.name if complaint.department else 'Admin review'}\n\n"
        "You can sign in to your citizen dashboard to view the full timeline."
    )
    return send_portal_email(subject, message, [email])


def send_portal_email(subject, message, recipients):
    if not recipients:
        return False

    from_email = getattr(settings, "EMAIL_HOST_USER", "") or settings.DEFAULT_FROM_EMAIL
    try:
        sent = send_mail(
            subject,
            message,
            from_email,
            recipients,
            fail_silently=False,
        )
    except Exception as exc:
        print(f"Email send failed: {exc}")
        return False
    return sent > 0


def verify_email_token(uidb64, token):
    user_id = force_str(urlsafe_base64_decode(uidb64))
    payload = signing.loads(
        token,
        salt=EMAIL_VERIFICATION_SALT,
        max_age=getattr(settings, "EMAIL_VERIFICATION_MAX_AGE_SECONDS", 172800),
    )
    user = User.objects.get(pk=user_id, email=payload.get("email"))
    if int(payload.get("user_id")) != user.pk:
        raise signing.BadSignature("User mismatch")
    return user


def verify_email_otp(identifier, otp):
    value = str(identifier or "").strip()
    code = str(otp or "").strip()
    if not value or not code:
        raise ValueError("Email/username and OTP are required.")
    if not code.isdigit() or len(code) != 6:
        raise ValueError("Enter the 6 digit OTP.")

    user = User.objects.get(
        Q(email__iexact=value) | Q(username__iexact=value),
        role="CITIZEN",
        is_active=True,
    )
    if user.email_verification_otp != code:
        raise signing.BadSignature("Invalid OTP.")

    created_at = user.email_verification_otp_created_at
    max_age = getattr(settings, "EMAIL_VERIFICATION_MAX_AGE_SECONDS", 172800)
    if not created_at or timezone.now() - created_at > timezone.timedelta(seconds=max_age):
        raise signing.SignatureExpired("OTP expired.")

    return user
