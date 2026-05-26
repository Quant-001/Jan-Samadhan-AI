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

    maps_url = ""
    if complaint.latitude is not None and complaint.longitude is not None:
        maps_url = f"https://www.google.com/maps/search/?api=1&query={complaint.latitude},{complaint.longitude}"
    gps_line = (
        f"GPS: {complaint.latitude}, {complaint.longitude}\n"
        if maps_url
        else "GPS: Not provided\n"
    )

    subject = f"Complaint submitted: #{complaint.ticket_id}"
    message = (
        f"Hello {complaint.complainant_name or complaint.citizen.first_name or complaint.citizen.username},\n\n"
        "Your complaint has been submitted successfully on Jan Samadhan AI.\n\n"
        f"Tracking ID: {complaint.ticket_id}\n"
        f"Title: {complaint.title}\n"
        f"Status: {complaint.get_status_display()}\n"
        f"Priority: {complaint.get_priority_display()}\n\n"
        f"Category: {complaint.get_category_display()}\n"
        f"Location: {complaint.location or 'Not provided'}\n"
        f"{gps_line}"
    )
    if maps_url:
        message += f"Google Maps: {maps_url}\n"
    message += (
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
    email_backend = getattr(settings, "EMAIL_BACKEND", "")
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
    if ".console." in email_backend:
        print("Email was written to the backend console because SMTP email is not configured.")
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


def make_login_otp(user):
    """Generate and store login OTP for user"""
    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    user.login_otp = otp
    user.login_otp_created_at = timezone.now()
    user.save(update_fields=["login_otp", "login_otp_created_at"])
    return otp


def send_login_otp_email(user):
    """Send login OTP to user's email"""
    if not user.email:
        return False

    otp = make_login_otp(user)
    subject = "Your Jan Samadhan AI login verification code"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "You are signing in to your Jan Samadhan AI account.\n\n"
        f"Your login verification code is: {otp}\n\n"
        "Enter this code on the login page to complete your sign in.\n"
        "This code will expire in 10 minutes.\n\n"
        "If you didn't attempt to sign in, please ignore this email."
    )
    return send_portal_email(subject, message, [user.email])


def verify_login_otp(user, otp):
    """Verify login OTP for user"""
    code = str(otp or "").strip()
    if not code:
        raise ValueError("OTP is required.")
    if not code.isdigit() or len(code) != 6:
        raise ValueError("Enter the 6 digit OTP.")

    if user.login_otp != code:
        raise signing.BadSignature("Invalid OTP.")

    created_at = user.login_otp_created_at
    max_age = getattr(settings, "LOGIN_OTP_MAX_AGE_SECONDS", 600)  # 10 minutes
    if not created_at or timezone.now() - created_at > timezone.timedelta(seconds=max_age):
        raise signing.SignatureExpired("OTP expired.")

    return user


def make_complaint_submission_otp(user):
    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    user.complaint_submission_otp = otp
    user.complaint_submission_otp_created_at = timezone.now()
    user.save(update_fields=["complaint_submission_otp", "complaint_submission_otp_created_at"])
    return otp


def send_complaint_submission_otp_email(user):
    if not user.email:
        return False

    otp = make_complaint_submission_otp(user)
    subject = "Confirm your Jan Samadhan AI complaint submission"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "Please confirm your email before submitting this complaint.\n\n"
        f"Your complaint submission OTP is: {otp}\n\n"
        "Enter this code on the complaint form to submit your grievance.\n"
        "This code will expire in 10 minutes."
    )
    return send_portal_email(subject, message, [user.email])


def verify_complaint_submission_otp(user, otp):
    code = str(otp or "").strip()
    if not code:
        raise ValueError("Complaint OTP is required.")
    if not code.isdigit() or len(code) != 6:
        raise ValueError("Enter the 6 digit complaint OTP.")

    if user.complaint_submission_otp != code:
        raise signing.BadSignature("Invalid complaint OTP.")

    created_at = user.complaint_submission_otp_created_at
    max_age = getattr(settings, "COMPLAINT_OTP_MAX_AGE_SECONDS", 600)
    if not created_at or timezone.now() - created_at > timezone.timedelta(seconds=max_age):
        raise signing.SignatureExpired("Complaint OTP expired.")

    return user
