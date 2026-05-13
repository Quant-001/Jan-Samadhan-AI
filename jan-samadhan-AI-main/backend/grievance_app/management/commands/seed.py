from django.core.management.base import BaseCommand
from django.utils import timezone
from grievance_app.models import Complaint, ComplaintHistory, Department, User

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@1234"


class Command(BaseCommand):
    help = "Seed initial departments and create superadmin"

    def handle(self, *args, **kwargs):
        departments = [
            {"name": "Electricity Department", "code": "ELECTRICITY", "email": "electricity@jansamadhan.in", "government_level": "STATE"},
            {"name": "Water Supply Department", "code": "WATER", "email": "water@jansamadhan.in", "government_level": "STATE"},
            {"name": "Sanitation Department", "code": "SANITATION", "email": "sanitation@jansamadhan.in", "government_level": "LOCAL"},
            {"name": "Roads & Infrastructure", "code": "ROADS", "email": "roads@jansamadhan.in", "government_level": "STATE"},
            {"name": "Public Services", "code": "PUBLIC_SERVICES", "email": "public@jansamadhan.in", "government_level": "CENTRAL"},
            {"name": "Health Department", "code": "HEALTH", "email": "health@jansamadhan.in", "government_level": "STATE"},
            {"name": "Education Department", "code": "EDUCATION", "email": "education@jansamadhan.in", "government_level": "STATE"},
            {"name": "General / Other", "code": "OTHER", "email": "general@jansamadhan.in", "government_level": "CENTRAL"},
        ]
        for d in departments:
            obj, created = Department.objects.get_or_create(code=d["code"], defaults=d)
            obj.government_level = d["government_level"]
            obj.email = d["email"]
            obj.save(update_fields=["government_level", "email"])
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created dept: {obj.name}"))
            else:
                self.stdout.write(f"  Exists: {obj.name}")

        admin_defaults = {
            "email": "admin@jansamadhan.in",
            "role": "ADMIN",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
            "officer_level": "MAIN_OFFICER",
        }
        admin, created = User.objects.get_or_create(username=ADMIN_USERNAME, defaults=admin_defaults)
        for field, value in admin_defaults.items():
            setattr(admin, field, value)
        admin.set_password(ADMIN_PASSWORD)
        admin.save()
        if created:
            self.stdout.write(self.style.SUCCESS(f"  Superadmin created: {ADMIN_USERNAME} / {ADMIN_PASSWORD}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"  Superadmin reset: {ADMIN_USERNAME} / {ADMIN_PASSWORD}"))

        department_profiles = {
            "ELECTRICITY": {"label": "Electricity", "slug": "electricity", "prefix": "ELEC", "pin": "452001", "sector": "Sector 4", "ward": "Ward 12"},
            "WATER": {"label": "Water", "slug": "water", "prefix": "WATER", "pin": "452002", "sector": "Sector 9", "ward": "Ward 18"},
            "SANITATION": {"label": "Sanitation", "slug": "sanitation", "prefix": "SAN", "pin": "452003", "sector": "Sector 2", "ward": "Ward 7"},
            "ROADS": {"label": "Roads", "slug": "roads", "prefix": "ROAD", "pin": "452004", "sector": "Sector 6", "ward": "Ward 21"},
            "PUBLIC_SERVICES": {"label": "Public Services", "slug": "public_services", "prefix": "PUB", "pin": "452005", "sector": "Service Zone", "ward": "Ward 5"},
            "HEALTH": {"label": "Health", "slug": "health", "prefix": "HEALTH", "pin": "452006", "sector": "Health Zone", "ward": "Ward 3"},
            "EDUCATION": {"label": "Education", "slug": "education", "prefix": "EDU", "pin": "452007", "sector": "School Zone", "ward": "Ward 14"},
            "OTHER": {"label": "General", "slug": "general", "prefix": "GEN", "pin": "452008", "sector": "Central Desk", "ward": "Ward 1"},
        }
        officer_tree = {}
        for code, profile in department_profiles.items():
            department = Department.objects.get(code=code)
            officer_tree[code] = self._seed_department_officers(department, profile)

        electricity = Department.objects.get(code="ELECTRICITY")
        water = Department.objects.get(code="WATER")
        main_officer = officer_tree["ELECTRICITY"]["head"]
        senior_officer = officer_tree["ELECTRICITY"]["officer"]
        field_officer = officer_tree["ELECTRICITY"]["field"]
        water_main = officer_tree["WATER"]["head"]

        citizen = self._upsert_user(
            username="citizen_demo",
            password="Citizen@1234",
            email="citizen.demo@jansamadhan.in",
            first_name="Demo",
            last_name="Citizen",
            role="CITIZEN",
        )

        if Complaint.objects.count() == 0:
            resolved = Complaint.objects.create(
                citizen=citizen,
                complainant_name="Demo Citizen",
                valid_id_number="DEMO-ID-1001",
                title="Street light repaired",
                description="Street light near ward 12 was not working.",
                category="ELECTRICITY",
                priority="MEDIUM",
                status="RESOLVED",
                department=electricity,
                assigned_officer=field_officer,
                location="Ward 12",
                sector="Ward 12",
                pin_code="452001",
                officer_remarks="Resolved and verified by field officer.",
                resolved_at=timezone.now(),
            )
            ComplaintHistory.objects.create(
                complaint=resolved,
                changed_by=field_officer,
                old_status="IN_PROGRESS",
                new_status="RESOLVED",
                note="Demo complaint resolved.",
            )
            Complaint.objects.create(
                citizen=citizen,
                complainant_name="Demo Citizen",
                valid_id_number="DEMO-ID-1002",
                title="Voltage fluctuation in locality",
                description="Frequent voltage drops in the evening.",
                category="ELECTRICITY",
                priority="HIGH",
                status="ASSIGNED",
                department=electricity,
                assigned_officer=senior_officer,
                location="Sector 4",
                sector="Sector 4",
                pin_code="452001",
            )
            Complaint.objects.create(
                citizen=citizen,
                complainant_name="Demo Citizen",
                valid_id_number="DEMO-ID-1003",
                title="Water supply delay",
                description="Water supply starts late every morning.",
                category="WATER",
                priority="MEDIUM",
                status="PENDING",
                department=water,
                assigned_officer=water_main,
                location="Main road, Sector 9",
                sector="Sector 9",
                pin_code="452002",
                routing_note="Demo water complaint routed to Water Department main officer for Sector 9 / 452002.",
            )
            self.stdout.write(self.style.SUCCESS("  Demo complaints created."))

        try:
            from axes.models import AccessAttempt, AccessFailureLog
            AccessAttempt.objects.all().delete()
            AccessFailureLog.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  Login lockouts cleared."))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  Could not clear login lockouts: {exc}"))

        self.stdout.write(self.style.SUCCESS("Seed complete!"))

    def _seed_department_officers(self, department, profile):
        head = self._upsert_user(
            username=f"head_{profile['slug']}",
            password="Head@1234",
            email=f"head.{profile['slug']}@jansamadhan.in",
            first_name=profile["label"],
            last_name="Head Officer",
            employee_id=f"HEAD-{profile['prefix']}-001",
            department=department,
            officer_level="DEPARTMENT_HEAD",
            jurisdiction=f"{profile['label']} department main desk",
            sector="State Desk",
            block="State Desk",
            pin_code=profile["pin"],
        )
        officer = self._upsert_user(
            username=f"officer_{profile['slug']}",
            password="Officer@1234",
            email=f"officer.{profile['slug']}@jansamadhan.in",
            first_name=profile["label"],
            last_name="Officer",
            employee_id=f"OFF-{profile['prefix']}-001",
            department=department,
            officer_level="DEPARTMENT_OFFICER",
            supervisor=head,
            jurisdiction=f"{profile['sector']} {profile['label']} zone",
            sector=profile["sector"],
            block=profile["sector"],
            pin_code=profile["pin"],
        )
        sub = self._upsert_user(
            username=f"sub_{profile['slug']}",
            password="Sub@1234",
            email=f"sub.{profile['slug']}@jansamadhan.in",
            first_name=profile["label"],
            last_name="Sub Officer",
            employee_id=f"SUB-{profile['prefix']}-001",
            department=department,
            officer_level="SUB_OFFICER",
            supervisor=officer,
            jurisdiction=f"{profile['ward']} {profile['label']} work",
            sector=profile["ward"],
            block=profile["ward"],
            pin_code=profile["pin"],
        )
        field = self._upsert_user(
            username=f"field_{profile['slug']}",
            password="Field@1234",
            email=f"field.{profile['slug']}@jansamadhan.in",
            first_name=profile["label"],
            last_name="Field Officer",
            employee_id=f"FIELD-{profile['prefix']}-001",
            department=department,
            officer_level="FIELD_OFFICER",
            supervisor=sub,
            jurisdiction=f"{profile['sector']} field unit",
            sector=profile["sector"],
            block=profile["sector"],
            pin_code=profile["pin"],
        )
        department.head_officer = head
        department.save(update_fields=["head_officer"])
        return {"head": head, "officer": officer, "sub": sub, "field": field}

    def _upsert_user(
        self,
        username,
        password,
        email,
        first_name,
        last_name,
        role="OFFICER",
        employee_id=None,
        department=None,
        officer_level="",
        supervisor=None,
        jurisdiction="",
        sector="",
        block="",
        pin_code="",
    ):
        defaults = {
            "email": email,
            "role": role,
            "first_name": first_name,
            "last_name": last_name,
            "phone": "9999999999",
            "employee_id": employee_id,
            "department": department,
            "officer_level": officer_level,
            "supervisor": supervisor,
            "jurisdiction": jurisdiction,
            "sector": sector,
            "block": block or sector,
            "pin_code": pin_code,
            "is_verified": True,
            "is_active": True,
        }
        user, _ = User.objects.get_or_create(username=username, defaults=defaults)
        for field, value in defaults.items():
            setattr(user, field, value)
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"  Login ready: {username} / {password}"))
        return user
