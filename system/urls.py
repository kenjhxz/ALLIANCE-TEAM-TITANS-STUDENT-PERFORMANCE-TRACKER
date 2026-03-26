from django.urls import path
from .api import LoginView, DegreeProgramView, CollegeView, DisciplineView, TeacherView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('programs/', DegreeProgramView.as_view(), name='degree-programs'),
    path('colleges/', CollegeView.as_view(), name='colleges'),
    path('disciplines/', DisciplineView.as_view(), name='disciplines'),
    path('teachers/', TeacherView.as_view(), name='teachers')
]