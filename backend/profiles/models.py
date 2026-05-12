
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

# Create your models here.
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email =  self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)
    
class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT' , 'student',
        PROFESSOR = "PROFESSOR", 'professor',
        ADMIN = "ADMIN", 'admin',

    email        = models.EmailField(unique=True)
    first_name   = models.CharField(max_length=50)
    last_name    = models.CharField(max_length=50)
    middle_name  = models.CharField(max_length=20, null=True, blank=True)
    role         = models.CharField(max_length=20, choices=Role.choices)

    #emailverif
    is_verified = models.BooleanField(default=False)

    #fcmtoken push notifs
    fcm_token = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    objects = UserManager()


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    @property 
    def is_student(self):
        return self.role == self.Role.STUDENT
    @property
    def is_teacher(self):
        return self.role == self.Role.PROFESSOR
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    

    def __str__(self):
        middle = f' {self.middle_name}' if self.middle_name else ''
        return f'{self.first_name}{middle} {self.last_name}'
    


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_token')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()


    def is_expired(self):
        return timezone.now()> self.expires_at
    
    def __str__(self):
        return f'Token for {self.user.email}'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_resets')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f'Reset token for {self.user.email}'


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=120)
    ip_address = models.CharField(max_length=45, blank=True)
    details = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        who = self.user.email if self.user else 'system'
        return f'{who} - {self.action}'
    

class AdminProfile(models.Model):
    admin_id = models.CharField(max_length=20, unique=True)
    user = models.OneToOneField('profiles.User', on_delete=models.CASCADE)

    def __str__(self):
        return f'Admin: {self.admin_id}'
   
    
class StudentProfile(models.Model):
    user       = models.OneToOneField('profiles.User', on_delete=models.CASCADE)
    student_id = models.CharField(max_length=20, unique=True)
    program    = models.ForeignKey('system.DegreeProgram', on_delete=models.PROTECT, null=True)
    year_level = models.IntegerField(default=1)

    def __str__(self):
        return f'Student: {self.student_id}'

class TeacherProfile(models.Model):
    user = models.OneToOneField('profiles.User', on_delete=models.CASCADE)
    employee_id  = models.CharField(max_length=10, unique=True)
    department = models.ForeignKey('system.College', on_delete=models.PROTECT)
    discipline = models.ManyToManyField('system.Discipline', blank=True)

    @property
    def discipline_by_department(self):
        return self.discipline.filter(program__college=self.department)


    def __str__(self):
        return f'Professor: {self.employee_id}'


class Notification(models.Model):
    class Category(models.TextChoices):
        GENERAL = 'GENERAL', 'General'
        OFFERING = 'OFFERING', 'Offering'
        ENROLLMENT = 'ENROLLMENT', 'Enrollment'
        GRADE = 'GRADE', 'Grade'

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=120)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.email} - {self.title}'
    
    

