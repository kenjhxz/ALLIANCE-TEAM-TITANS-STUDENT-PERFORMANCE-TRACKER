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


def send_password_reset_email(email, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
    send_mail(
        subject="Reset your ORBIT password",
        message=(
            "We received a request to reset your ORBIT password.\n\n"
            f"Reset link: {reset_url}\n\n"
            "If you didn't request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def send_password_reset_email(email, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
    send_mail(
        subject="Reset your ORBIT password",
        message=(
            "We received a password reset request.\n\n"
            f"Reset link: {reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def create_notification(recipient, title, message, category='GENERAL', payload=None):
    if not recipient:
        return None

    from .models import Notification

    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        category=category,
        payload=payload or {},
    )


def send_grade_update_email(email, student_name, discipline_code, term_label, updated_by, action='updated'):
    action_label = 'posted' if action == 'created' else 'updated'
    send_mail(
        subject=f"Grade {action_label}: {discipline_code}",
        message=(
            f"Hello {student_name},\n\n"
            f"Your grade for {discipline_code} ({term_label}) was {action_label} by {updated_by}.\n"
            "Please log in to ORBIT to view the record.\n\n"
            f"{settings.FRONTEND_URL}/login"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )


def send_password_reset_email(email, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
    send_mail(
        subject="Reset your ORBIT password",
        message=(
            "We received a password reset request for your account.\n\n"
            f"Reset link: {reset_url}\n\n"
            "If you did not request this, please ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )