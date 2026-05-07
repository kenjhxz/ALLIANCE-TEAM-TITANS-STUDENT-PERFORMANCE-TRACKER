from django.urls import path
from .views import (
    DegreeProgramView, CollegeView, DisciplineView, SemesterLoadView,
    AcademicTermView, AcademicTermDetailView,
    SubjectOfferingView,
    StudentDisciplineRequestView, StudentScheduleSelectView,
    AdminEnrollmentQueueView, GradeViewSet
    , TeacherOfferingsView, TeacherOfferingEnrollmentsView
)

urlpatterns = [
    # school setup
    path('colleges/',        CollegeView.as_view(),       name='colleges'),
    path('programs/',        DegreeProgramView.as_view(),  name='degree-programs'),
    path('disciplines/',     DisciplineView.as_view(),     name='disciplines'),
    path('semester-loads/',  SemesterLoadView.as_view(),   name='semester-loads'),

    # terms & offerings
    path('terms/',           AcademicTermView.as_view(),       name='academic-term'),
    path('terms/<int:pk>/',  AcademicTermDetailView.as_view(), name='academic-term-detail'),
    path('offerings/',       SubjectOfferingView.as_view(),    name='subject-offering'),

    # enrollment — stage 1: discipline request
    path('enrollment/request/',  StudentDisciplineRequestView.as_view(), name='discipline-request'),

    # enrollment — stage 2: schedule selection
    path('enrollment/schedule/', StudentScheduleSelectView.as_view(),    name='schedule-select'),

    # admin queue
    path('enrollment/queue/',    AdminEnrollmentQueueView.as_view(),     name='enrollment-queue'),

    # Grades
    path('grades/', GradeViewSet.as_view({'get': 'list', 'post': 'create'}), name='grades'),
    path('grades/<int:pk>/', GradeViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'}), name='grade-detail'),
    path('grades/mine/', GradeViewSet.as_view({'get': 'mine'}), name='my-grades'),
    path('grades/export/', GradeViewSet.as_view({'get': 'export'}), name='grades-export'),

    # Teacher-specific endpoints
    path('teacher/offerings/', TeacherOfferingsView.as_view(), name='teacher-offerings'),
    path('teacher/offerings/<int:offering_id>/enrollments/', TeacherOfferingEnrollmentsView.as_view(), name='teacher-offering-enrollments'),
]