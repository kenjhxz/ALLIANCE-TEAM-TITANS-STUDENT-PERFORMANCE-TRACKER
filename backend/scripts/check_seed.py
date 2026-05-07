import os
import sys
# Ensure project root (backend/) is on sys.path so `core` settings import resolves
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from system.models import SubjectOffering, StudentEnrollment
from profiles.models import StudentProfile, TeacherProfile

User = get_user_model()

print('prof exists', User.objects.filter(email='prof@example.com').exists())
print('student exists', User.objects.filter(email='student@example.com').exists())
print('offerings count', SubjectOffering.objects.count())
print('enrollments count', StudentEnrollment.objects.count())

try:
    prof = User.objects.get(email='prof@example.com')
    print('prof role', prof.role)
except Exception as e:
    print('prof lookup error', e)

try:
    student = User.objects.get(email='student@example.com')
    print('student role', student.role)
    sp = StudentProfile.objects.get(user=student)
    print('student profile id', sp.id, 'student_id', sp.student_id)
except Exception as e:
    print('student lookup error', e)

print('done')
