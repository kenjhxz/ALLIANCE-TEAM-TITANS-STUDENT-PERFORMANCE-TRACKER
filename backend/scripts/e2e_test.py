import os
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from rest_framework.test import APIClient
from django.conf import settings

# Ensure the test host is allowed when using APIClient (which uses 'testserver' host)
for h in ('testserver', 'localhost', '127.0.0.1'):
    if h not in settings.ALLOWED_HOSTS:
        settings.ALLOWED_HOSTS.append(h)

client = APIClient()

print('Logging in as professor...')
res = client.post('/auth/login/', {'email': 'prof@example.com', 'password': 'profpass'}, format='json')
print('login status', res.status_code, res.data)
if res.status_code != 200:
    raise SystemExit('Professor login failed')

token = res.data['token']
client.credentials(HTTP_AUTHORIZATION='Token ' + token)

print('Fetching teacher offerings...')
res = client.get('/system/teacher/offerings/')
print('offerings status', res.status_code)
if res.status_code == 200 and res.data:
    off = res.data[0]
    print('selected offering', off['id'], off.get('offer_code'))
else:
    raise SystemExit('No offerings for professor')

print('Fetching enrollments for offering...')
res = client.get(f"/system/teacher/offerings/{off['id']}/enrollments/")
print('enrollments status', res.status_code)
print('enrollments data', res.data)
if not res.data:
    raise SystemExit('No enrollments to grade')

enr = res.data[0]
student_profile_id = enr.get('student_id')
print('student_profile_id', student_profile_id)

# Post or update a grade
payload = {
    'student': student_profile_id,
    'discipline': off.get('discipline'),
    'offering': off.get('id'),
    'term': off.get('term'),
    'prelim': 1.5,
    'midterm': 2.0,
    'finals': 2.5,
}
print('Posting grade payload:', payload)
existing = client.get('/system/grades/', {'student': student_profile_id, 'discipline': off.get('discipline'), 'term': off.get('term')})
print('existing grades status', existing.status_code)
existing_data = existing.data if hasattr(existing, 'data') else []
if existing_data:
    grade_id = existing_data[0]['id']
    print('updating existing grade id', grade_id)
    res = client.patch(f'/system/grades/{grade_id}/', payload, format='json')
    print('update grade status', res.status_code, res.data)
else:
    res = client.post('/system/grades/', payload, format='json')
    print('post grade status', res.status_code, res.data)

# Login as student and check grades
client.credentials()  # remove professor auth
print('Logging in as student...')
res = client.post('/auth/login/', {'email': 'student@example.com', 'password': 'studentpass'}, format='json')
print('student login', res.status_code, res.data)
if res.status_code != 200:
    raise SystemExit('Student login failed')
student_token = res.data['token']
client.credentials(HTTP_AUTHORIZATION='Token ' + student_token)

res = client.get('/system/grades/mine/')
print('student grades status', res.status_code)
print('student grades:', res.data)

res = client.get('/system/grades/export/')
print('export status', res.status_code)
print('export content-type', res['Content-Type'])
print('export length', len(res.content))

print('E2E test complete')
