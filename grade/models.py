from django.db import models

# Create your models here.

class Grade(models.Model):
    student = models.ForeignKey('user.Student', on_delete=models.CASCADE)
    teacher = models.ForeignKey('user.Teacher', on_delete=models.CASCADE)
    discipline = models.ForeignKey('system.Discipline', on_delete=models.PROTECT)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.TextField(blank=True)
    date_recorded = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.discipline.name}: {self.score}"
