from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from user.models import Student, Teacher
from system .models import DegreeProgram, College, Discipline, User


def setup_default_permissions():
    teacher_group = Group.objects.get_or_create(name='Teachers')[0]
    student_group = Group.objects.get_or_create(name='Students')[0]
    admin_group = Group.objects.get_or_create(name='Admins')[0]


    #admin permissions
    models_for_admin_only = [User, Student, Teacher, DegreeProgram, College, Discipline]

    for model in models_for_admin_only:
        ct = ContentType.objects.get_for_model(model)
        permissions = Permission.objects.filter(content_type=ct)
        for perm in permissions:
            admin_group.permissions.add(perm)
        
        