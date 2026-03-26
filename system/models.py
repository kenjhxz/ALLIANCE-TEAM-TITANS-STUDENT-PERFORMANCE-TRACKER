from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

# Create your models here.

#userauth

class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    is_teacher = models.BooleanField(default=False)
    is_student = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',  
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions_set', 
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )

class College(models.Model):
    name = models.CharField(max_length=250)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name
    
class DegreeProgram(models.Model):
    name = models.CharField(max_length=250)
    code = models.CharField(max_length=10, unique=True)
    college = models.ForeignKey(College, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.name
    
class Discipline(models.Model):
    name = models.CharField(max_length=250)
    program = models.ForeignKey(DegreeProgram, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.name
    

    





