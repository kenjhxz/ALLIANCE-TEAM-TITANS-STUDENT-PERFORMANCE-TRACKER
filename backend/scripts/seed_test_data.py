import os
import sys
# ensure backend project path on sys.path so core.settings can be imported
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from profiles.models import StudentProfile, TeacherProfile, AdminProfile
from system.models import College, DegreeProgram, Discipline, AcademicTerm, SubjectOffering, StudentEnrollment
from django.utils import timezone

User = get_user_model()

# Admin
admin_email = 'admin@example.com'
if not User.objects.filter(email=admin_email).exists():
    admin = User.objects.create_superuser(email=admin_email, password='adminpass', first_name='Admin', last_name='User', role='ADMIN')
else:
    admin = User.objects.get(email=admin_email)
AdminProfile.objects.get_or_create(user=admin, defaults={'admin_id': 'ADM001'})

# College / Program / Discipline
college, _ = College.objects.get_or_create(code='SCI', defaults={'name': 'School of Science'})
program, _ = DegreeProgram.objects.get_or_create(code='BSCS', defaults={'name': 'BS Computer Science', 'college': college})
discipline, _ = Discipline.objects.get_or_create(code='CS101', program=program, defaults={'name': 'Intro to CS', 'year_level': 1, 'semester': 1, 'units': 3})

# Term
term, _ = AcademicTerm.objects.get_or_create(school_year='2026-2027', semester=1, defaults={'is_active': True, 'start_date': '2026-08-01', 'end_date': '2027-05-31'})

# Teacher
prof_email = 'prof@example.com'
if not User.objects.filter(email=prof_email).exists():
    prof_user = User.objects.create_user(email=prof_email, password='profpass', first_name='Prof', last_name='Smith', role='PROFESSOR')
else:
    prof_user = User.objects.get(email=prof_email)
prof_user.is_verified = True
prof_user.save()
teacher_profile, _ = TeacherProfile.objects.get_or_create(user=prof_user, defaults={'employee_id': 'T001', 'department': college})

# Offering
offering, created = SubjectOffering.objects.get_or_create(discipline=discipline, term=term, defaults={'teacher': teacher_profile, 'schedule': 'MWF 9-10', 'room': 'R101', 'max_slots': 30})
if created:
    offering.offer_code = offering.offer_code  # save() will generate code if missing
    offering.save()

# Student
student_email = 'student@example.com'
if not User.objects.filter(email=student_email).exists():
    student_user = User.objects.create_user(email=student_email, password='studentpass', first_name='Stud', last_name='Dent', role='STUDENT')
else:
    student_user = User.objects.get(email=student_email)
student_user.is_verified = True
student_user.save()
student_profile, _ = StudentProfile.objects.get_or_create(user=student_user, defaults={'student_id': 'S1001', 'program': program, 'year_level': 1})

# Enrollment
enr, created = StudentEnrollment.objects.get_or_create(student=student_profile, discipline=discipline, term=term, defaults={'status': StudentEnrollment.Status.ENROLLED, 'offering': offering})
if created:
    offering.current_slots = offering.current_slots + 1
    offering.save()

print('Seed complete:')
print(' admin:', admin_email, '/adminpass')
print(' professor:', prof_email, '/profpass')
print(' student:', student_email, '/studentpass')
print(' offering id:', offering.id, 'offer_code:', offering.offer_code)
print(' student profile id:', student_profile.id)
