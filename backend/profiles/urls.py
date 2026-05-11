from django.urls import path
from .views import (
    RegisterView, VerifyEmailView, LoginView, LogoutView,
    MeView, UpdateFCMTokenView, ResendVerificationView,
    ChangePasswordView, PasswordResetRequestView, PasswordResetConfirmView, AuditLogView, AdminUserUpdateView,
    StudentProfileView, TeacherProfileView,
    AdminProfileView, AdminTeacherView, AdminStudentView)




urlpatterns = [
    #auth
    path('register/',             RegisterView.as_view(),          name='register'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(),   name='verify-email'),
    path('login/',                LoginView.as_view(),             name='login'),
    path('logout/',               LogoutView.as_view(),            name='logout'),
    path('resend-verification/',  ResendVerificationView.as_view(),name='resend-verification'),
    path('password/change/',      ChangePasswordView.as_view(),    name='change-password'),
    path('password/forgot/',      PasswordResetRequestView.as_view(), name='password-forgot'),
    path('password/reset/',       PasswordResetConfirmView.as_view(), name='password-reset'),

    #user
    path('me/',                   MeView.as_view(),                name='user-me'),
    path('me/fcm-token/',         UpdateFCMTokenView.as_view(),    name='update-fcm-token'),

    #profiles
    path('profile/student/',      StudentProfileView.as_view(),    name='student-profile'),
    path('profile/teacher/',      TeacherProfileView.as_view(),    name='teacher-profile'),
    path('profile/admin/',        AdminProfileView.as_view(),      name='admin-profile'),



    #ADMIN-ONLY ENDPOINTS TO CREATE USERS
    path('admin/create-teacher/', AdminTeacherView.as_view(), name='admin-create-teacher'),
    path('admin/teachers/', AdminTeacherView.as_view(), name='admin-list-teachers'),
    path('admin/create-student/', AdminStudentView.as_view(), name='admin-create-student'),
    path('admin/students/', AdminStudentView.as_view(), name='admin-list-students'),
    path('admin/users/<int:user_id>/', AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('admin/audit-logs/', AuditLogView.as_view(), name='admin-audit-logs'),
]