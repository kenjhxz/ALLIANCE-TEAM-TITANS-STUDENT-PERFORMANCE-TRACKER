from django.db import models

# Create your models here.
class Student(models.Model):

    user = models.OneToOneField('system.User', on_delete=models.CASCADE)

    student_id = models.CharField(max_length=10, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=20, null=True, blank=True)
    course = models.ForeignKey('system.DegreeProgram', on_delete=models.PROTECT)

    def __str__(self):
        middle = f'{self.middle_name}' if self.middle_name else ''
        return f'{self.first_name}{middle} {self.last_name}'
    

class Teacher(models.Model):
    
    user = models.OneToOneField('system.User', on_delete=models.CASCADE)


    teacher_id = models.CharField(max_length=10, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=20, null=True, blank=True)
    department = models.ForeignKey('system.College', on_delete=models.PROTECT)
    discipline = models.ManyToManyField('system.Discipline', blank=True)

    @property
    def discipline_by_department(self):
        return self.discipline.filter(college=self.department)
    
    def __str__(self):
        middle = f'{self.middle_name}' if self.middle_name else ''
        return f'{self.first_name}{middle} {self.last_name}'


