from django.core.mail import send_mail
from django.conf import settings
import string, secrets

def send_verification_email(email, token):
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
    send_mail(
        subject="Verify your ORBIT Account 📖",
        message=f"Click the link to verify your account: {verification_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )



def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_teacher_credentials_email(email, first_name, employee_id, temp_password):
    send_mail(
        subject="Your ORBIT Faculty Account 📖",
        message=(
            f"Hello {first_name},\n\n"
            f"An admin has created a faculty account for you on ORBIT.\n\n"
            f"Employee ID: {employee_id}\n"
            f"Email: {email}\n"
            f"Temporary Password: {temp_password}\n\n"
            f"Please log in and change your password immediately.\n"
            f"{settings.FRONTEND_URL}/login"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )



def send_student_credentials_email(email, first_name, student_id, temp_password):
    send_mail(
        subject="Your ORBIT Student Account 📖",
        message=(
            f"Hello {first_name},\n\n"
            f"An admin has created a student account for you on ORBIT.\n\n"
            f"Student ID: {student_id}\n"
            f"Email: {email}\n"
            f"Temporary Password: {temp_password}\n\n"
            f"Please log in and change your password immediately.\n"
            f"{settings.FRONTEND_URL}/login"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )