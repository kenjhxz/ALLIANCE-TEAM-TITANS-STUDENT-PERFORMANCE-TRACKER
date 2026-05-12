from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta
import secrets
import logging
logger = logging.getLogger(__name__)


def log_action(request, action, details=None, user=None):
    AuditLog.objects.create(
        user=user or (request.user if getattr(request, 'user', None) and request.user.is_authenticated else None),
        action=action,
        ip_address=request.META.get('REMOTE_ADDR', ''),
        details=details or {},
    )

from .models import User, StudentProfile, TeacherProfile, AdminProfile, EmailVerificationToken, PasswordResetToken, AuditLog
from .utils import send_verification_email, send_password_reset_email
from .serializers import (
    RegisterSerializer, UserSerializer, LoginSerializer, StudentProfileSerializer, 
    TeacherProfileSerializer, UpdateFCMTokenSerializer, AdminProfileSerializer,
    #FOR ADMIN VIEW TO CREATE USERS
    AdminCreateTeacherSerializer, TeacherListSerializer, AdminCreateStudentSerializer, StudentListSerializer,
    ChangePasswordSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, AuditLogSerializer
)

# Create your views here.
# ── custom permission classes ────────────────────────────────────────────────

class IsStudent(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'STUDENT'

class IsTeacher(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'PROFESSOR'

class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'
    

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_admin
    
# ── auth views ───────────────────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self,request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            verification, _ = EmailVerificationToken.objects.update_or_create(
                user=user,
                defaults={
                    "token": secrets.token_urlsafe(32),
                    "expires_at": timezone.now() + timedelta(hours=24),
                }
            )


            send_verification_email(user.email, verification.token)
            return Response({
                "message": "Registration successful. Please check your email to verify your account.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        verification = EmailVerificationToken.objects.filter(token=token).first()

        if not verification:
            return Response(
                {
                    "message": "This link is no longer valid. It may have already been used."
                },
                status=status.HTTP_200_OK,
            )

        user = verification.user

        if user.is_verified:
            verification.delete()
            return Response(
                {"message": "Email already verified. You can log in."},
                status=status.HTTP_200_OK,
            )

        if verification.is_expired():
            verification.delete()
            return Response(
                {"error": "Verification link has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_verified = True
        user.save()
        verification.delete()

        return Response(
            {"message": "Email verified successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            logger.info(f"[AUDIT] LOGIN  | user={user.email} | role={user.role} | ip={request.META.get('REMOTE_ADDR')}")
            log_action(request, 'LOGIN', {'role': user.role}, user=user)
            return Response({
                "token": token.key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"[AUDIT] LOGOUT | user={user.email} | role={user.role} | ip={request.META.get('REMOTE_ADDR')}")
        log_action(request, 'LOGOUT', {'role': user.role}, user=user)
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)



#----------user views------------------------------------


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request, 'UPDATE_PROFILE', {'fields': list(request.data.keys())})
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UpdateFCMTokenSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "FCM token updated."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'current_password': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        log_action(request, 'CHANGE_PASSWORD')
        return Response({'message': 'Password updated.'})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'message': 'If the email exists, a reset link has been sent.'})

        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=2),
        )
        send_password_reset_email(user.email, token)
        log_action(request, 'PASSWORD_RESET_REQUEST', {'email': user.email}, user=user)
        return Response({'message': 'Password reset link sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token = serializer.validated_data['token']
        reset = PasswordResetToken.objects.filter(token=token).first()
        if not reset or reset.is_expired():
            return Response({'error': 'Reset link is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user = reset.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        reset.delete()
        log_action(request, 'PASSWORD_RESET_CONFIRM', {'email': user.email}, user=user)
        return Response({'message': 'Password has been reset.'})


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No account found."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_verified:
            return Response(
                {"message": "Account already verified. You can log in."},
                status=status.HTTP_200_OK
            )

        verification, _ = EmailVerificationToken.objects.update_or_create(
            user=user,
            defaults={
                "token": secrets.token_urlsafe(32),
                "expires_at": timezone.now() + timedelta(hours=24),
            }
        )

        send_verification_email(user.email, verification.token)

        return Response({"message": "Verification email resent."}, status=status.HTTP_200_OK)


#----------profile views ----------------------------------



class StudentProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStudent]
    serializer_class = StudentProfileSerializer

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile


class TeacherProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsTeacher]
    serializer_class = TeacherProfileSerializer

    def get_object(self):
        profile, _ = TeacherProfile.objects.get_or_create(user=self.request.user)
        return profile


class AdminProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProfileSerializer

    def get_object(self):
        profile, _ = AdminProfile.objects.get_or_create(user=self.request.user)
        return profile



#ADMIN VIEWS FOR MANAGING TEACHERS AND STUDENTS
class AdminTeacherView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateTeacherSerializer
        return TeacherListSerializer

    def get_queryset(self):
        return TeacherProfile.objects.select_related('user', 'department') \
                                     .prefetch_related('discipline').all()

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request, 'ADMIN_CREATE_TEACHER', {'email': user.email}, user=self.request.user)
    
class AdminStudentView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateStudentSerializer 
        return StudentListSerializer

    def get_queryset(self):
        return StudentProfile.objects.select_related('user', 'program', 'program__college') \
                                     .prefetch_related('enrolled_disciplines').all()

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request, 'ADMIN_CREATE_STUDENT', {'email': user.email}, user=self.request.user)


class AuditLogView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        action = self.request.query_params.get('action')
        email = self.request.query_params.get('email')
        if action:
            qs = qs.filter(action__icontains=action)
        if email:
            qs = qs.filter(user__email__icontains=email)
        return qs


class AdminUserUpdateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=404)

        for field in ['first_name', 'last_name', 'middle_name', 'email', 'is_active']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        if user.role == 'STUDENT':
            profile = StudentProfile.objects.filter(user=user).first()
            if profile:
                if 'program' in request.data:
                    profile.program_id = request.data['program']
                if 'year_level' in request.data:
                    profile.year_level = request.data['year_level']
                profile.save()
        elif user.role == 'PROFESSOR':
            profile = TeacherProfile.objects.filter(user=user).first()
            if profile:
                if 'department' in request.data:
                    profile.department_id = request.data['department']
                if 'employee_id' in request.data:
                    profile.employee_id = request.data['employee_id']
                profile.save()

        log_action(request, 'ADMIN_UPDATE_USER', {'user_id': user_id, 'fields': list(request.data.keys())}, user=request.user)
        return Response(UserSerializer(user).data)

    def delete(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=404)

        if request.user.id == user.id:
            return Response({'error': 'You cannot delete your own account.'}, status=400)

        log_action(
            request,
            'ADMIN_DELETE_USER',
            {'user_id': user_id, 'email': user.email, 'role': user.role},
            user=request.user,
        )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)