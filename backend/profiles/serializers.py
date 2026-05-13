from rest_framework import serializers
from .models import User, StudentProfile, TeacherProfile, EmailVerificationToken, AdminProfile, PasswordResetToken, AuditLog, Notification
from django.contrib.auth import authenticate
from django.utils import timezone         
from datetime import timedelta
import secrets
from .utils import generate_temp_password, send_teacher_credentials_email, send_student_credentials_email
from system.models import College, Discipline, DegreeProgram
from system.serializers import CollegeSerializer, DisciplineSerializer, DegreeProgramSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    student_id       = serializers.CharField(write_only=True, required=False, allow_blank=True)
    employee_id      = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_id         = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = [
            'email',
            'first_name', 'last_name', 'middle_name',
            'role', 'password', 'confirm_password',
            'student_id', 'employee_id', 'admin_id',
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        role = data.get('role')
        required = {
            User.Role.STUDENT:   'student_id',
            User.Role.PROFESSOR: 'employee_id',
            User.Role.ADMIN:     'admin_id',
        }
        field = required.get(role)
        if field and not data.get(field):
            raise serializers.ValidationError({field: f"This field is required for {role}."})

        if role == User.Role.STUDENT:
            student_id = data.get('student_id')
            if student_id and StudentProfile.objects.filter(student_id=student_id).exists():
                raise serializers.ValidationError({
                    'student_id': 'Student ID already exists. Please contact the registrar if this is incorrect.'
                })

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        role = validated_data.get('role')

        student_id  = validated_data.pop('student_id', None) or None
        employee_id = validated_data.pop('employee_id', None) or None
        admin_id    = validated_data.pop('admin_id', None) or None

        user = User.objects.create_user(**validated_data)
        user.is_active   = True
        user.is_verified = False
        user.save()

        if role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user, student_id=student_id)
        elif role == User.Role.PROFESSOR:
            TeacherProfile.objects.create(user=user, employee_id=employee_id)
        elif role == User.Role.ADMIN:
            AdminProfile.objects.create(user=user, admin_id=admin_id)

        EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(hours=24)
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email',
            'first_name', 'last_name', 'middle_name', 'full_name',
            'role', 'is_verified'
        ]

    def get_full_name(self, obj):
        return " ".join(n for n in [obj.first_name, obj.middle_name, obj.last_name] if n)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_verified:
            raise serializers.ValidationError("Please verify your email before logging in.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        data['user'] = user
        return data
    

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AdminProfile
        fields = ['admin_id', 'user']

class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TeacherProfile
        fields = ['employee_id', 'user']

class StudentProfileSerializer(serializers.ModelSerializer):
    first_name   = serializers.CharField(source='user.first_name', required=False)
    last_name    = serializers.CharField(source='user.last_name',  required=False)
    middle_name  = serializers.CharField(source='user.middle_name', required=False, allow_blank=True, allow_null=True)
    email        = serializers.EmailField(source='user.email',     read_only=True)
    program_name = serializers.CharField(source='program.name',    read_only=True)
    program_code = serializers.CharField(source='program.code',    read_only=True)
    college_name = serializers.CharField(source='program.college.name', read_only=True)

    class Meta:
        model  = StudentProfile
        fields = [
            'student_id', 'year_level',
            'first_name', 'last_name', 'middle_name', 'email',
            'program_name', 'program_code', 'college_name',
        ]    

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        return super().update(instance, validated_data)

class UpdateFCMTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['fcm_token']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_email', 'action', 'ip_address', 'details', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_email', 'title', 'message',
            'category', 'payload', 'is_read', 'created_at',
        ]




#ADMIN SERIALZIERS FOR ADDING PROF AND STUDENT --------------------------------------------------------------------------------------------------

class AdminCreateTeacherSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(write_only=True)
    department  = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.all(), write_only=True
    )
    disciplines = serializers.PrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model  = User
        fields = [
            'email', 'first_name', 'last_name', 'middle_name',
            'employee_id', 'department', 'disciplines',
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_employee_id(self, value):
        if TeacherProfile.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("This employee ID is already in use.")
        return value

    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        department  = validated_data.pop('department')
        disciplines = validated_data.pop('disciplines', [])

        temp_password = generate_temp_password()

        user = User.objects.create_user(
            **validated_data,
            password=temp_password,
            role=User.Role.PROFESSOR,
            is_active=True,
            is_verified=True,  
        )

        profile = TeacherProfile.objects.create(
            user=user,
            employee_id=employee_id,
            department=department,
        )
        if disciplines:
            profile.discipline.set(disciplines)

        send_teacher_credentials_email(
            email=user.email,
            first_name=user.first_name,
            employee_id=employee_id,
            temp_password=temp_password,
        )

        return user



class TeacherListSerializer(serializers.ModelSerializer):
    full_name   = serializers.SerializerMethodField()
    email       = serializers.EmailField(source='user.email', read_only=True)
    user_id     = serializers.IntegerField(source='user.id', read_only=True)
    is_active   = serializers.BooleanField(source='user.is_active', read_only=True)
    department  = serializers.StringRelatedField()
    disciplines = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model  = TeacherProfile
        fields = ['id', 'user_id', 'employee_id', 'full_name', 'email', 'is_active', 'department', 'disciplines']

    def get_full_name(self, obj):
        u = obj.user
        mid = f" {u.middle_name}" if u.middle_name else ""
        return f"{u.first_name}{mid} {u.last_name}"
    

class AdminCreateStudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(write_only=True)
    program    = serializers.PrimaryKeyRelatedField(queryset=DegreeProgram.objects.all(), write_only=True)
    year_level = serializers.IntegerField(write_only=True)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'middle_name', 'student_id', 'program', 'year_level']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_student_id(self, value):
        if StudentProfile.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("This student ID is already in use.")
        return value

    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        program    = validated_data.pop('program')
        year_level = validated_data.pop('year_level')

        temp_password = generate_temp_password()

        user = User.objects.create_user(
            **validated_data,
            password=temp_password,
            role=User.Role.STUDENT,
            is_active=True,
            is_verified=True,
        )

        StudentProfile.objects.create(
            user=user,
            student_id=student_id,
            program=program,
            year_level=year_level,
        )

        send_student_credentials_email(
            email=user.email,
            first_name=user.first_name,
            student_id=student_id,
            temp_password=temp_password,
        )

        return user


class StudentListSerializer(serializers.ModelSerializer):
    full_name          = serializers.SerializerMethodField()
    email              = serializers.EmailField(source='user.email', read_only=True)
    user_id            = serializers.IntegerField(source='user.id', read_only=True)
    is_active          = serializers.BooleanField(source='user.is_active', read_only=True)
    program_name       = serializers.CharField(source='program.name', read_only=True)
    college_name       = serializers.CharField(source='program.college.name', read_only=True)
    enrolled_subjects  = serializers.SerializerMethodField()
    date_joined        = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model  = StudentProfile
        fields = [
            'id', 'user_id', 'student_id', 'full_name', 'email', 'is_active',
            'program_name', 'college_name', 'year_level',
            'enrolled_subjects', 'date_joined',
        ]

    def get_full_name(self, obj):
        u = obj.user
        mid = f" {u.middle_name}" if u.middle_name else ""
        return f"{u.first_name}{mid} {u.last_name}"

    def get_enrolled_subjects(self, obj):
        return obj.enrollments.filter(
                status='ENROLLED'
            ).values(
                'discipline__id',
                'discipline__name', 
                'discipline__semester',
                'discipline__year_level',
            ).order_by('discipline__year_level', 'discipline__semester')

#END OF ADMIN SERIALZIERS FOR ADDING PROF AND STUDENT --------------------------------------------------------------------------------------------------
