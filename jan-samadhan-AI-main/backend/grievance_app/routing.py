import re

from .models import User


PIN_RE = re.compile(r"\b\d{6}\b")


def normalize_pin(value):
    match = PIN_RE.search(str(value or ""))
    return match.group(0) if match else ""


def extract_pin(*parts):
    return normalize_pin(" ".join(str(part or "") for part in parts))


def route_complaint_to_department_head(complaint):
    if not complaint.department_id:
        complaint.routing_note = "No department matched. Admin review required."
        complaint.save(update_fields=["routing_note"])
        return None

    head = select_department_head(
        complaint.department,
        sector=complaint.sector,
        pin_code=complaint.pin_code,
        location=complaint.location,
    )
    if not head:
        complaint.routing_note = f"No active main officer found for {complaint.department.name}."
        complaint.save(update_fields=["routing_note"])
        return None

    complaint.assigned_officer = head
    complaint.status = "ASSIGNED"
    complaint.routing_note = (
        f"Routed to {head.get_full_name() or head.username}, "
        f"{complaint.department.name} main officer"
        f"{_area_suffix(complaint)}."
    )
    complaint.save(update_fields=["assigned_officer", "status", "routing_note"])
    return head


def select_department_head(department, sector="", pin_code="", location=""):
    candidates = User.objects.filter(
        role="OFFICER",
        is_active=True,
        department=department,
        officer_level="DEPARTMENT_HEAD",
    )
    if department.head_officer_id:
        candidates = candidates | User.objects.filter(
            id=department.head_officer_id,
            role="OFFICER",
            is_active=True,
        )

    ranked = sorted(
        candidates.distinct(),
        key=lambda officer: _area_score(officer, sector, pin_code, location),
        reverse=True,
    )
    return ranked[0] if ranked else None


def order_officers_by_area(queryset, complaint):
    return sorted(
        queryset,
        key=lambda officer: _area_score(
            officer,
            getattr(complaint, "sector", ""),
            getattr(complaint, "pin_code", ""),
            getattr(complaint, "location", ""),
        ),
        reverse=True,
    )


def _area_score(officer, sector="", pin_code="", location=""):
    score = 0
    officer_pin = normalize_pin(officer.pin_code or officer.jurisdiction)
    complaint_pin = normalize_pin(pin_code or location)
    if officer_pin and complaint_pin and officer_pin == complaint_pin:
        score += 100

    officer_sector = (officer.sector or "").strip().lower()
    complaint_sector = (sector or "").strip().lower()
    if officer_sector and complaint_sector and officer_sector == complaint_sector:
        score += 60

    haystack = " ".join(
        [officer.jurisdiction or "", officer.sector or "", officer.pin_code or ""]
    ).lower()
    for token in {complaint_sector, complaint_pin, str(location or "").strip().lower()}:
        if token and token in haystack:
            score += 15
    return score


def _area_suffix(complaint):
    parts = [part for part in [complaint.sector, complaint.pin_code] if part]
    return f" for {' / '.join(parts)}" if parts else ""
