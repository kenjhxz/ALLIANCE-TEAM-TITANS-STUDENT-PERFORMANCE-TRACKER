from django.db import models
from profiles.models import StudentProfile, TeacherProfile

class College(models.Model):
    name = models.CharField(max_length=250)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name

class DegreeProgram(models.Model):
    name    = models.CharField(max_length=250)
    code    = models.CharField(max_length=10, unique=True)
    college = models.ForeignKey(College, on_delete=models.CASCADE, default=1)

    def __str__(self):
        return self.name

class Discipline(models.Model):
    name          = models.CharField(max_length=250)
    code          = models.CharField(max_length=20)
    program       = models.ForeignKey(DegreeProgram, on_delete=models.CASCADE)
    year_level    = models.IntegerField(default=1)
    semester      = models.IntegerField(default=1)
    units         = models.IntegerField(default=3)
    prerequisites = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name='unlocks'
    )

    class Meta:
        unique_together = ['program', 'code']

    def __str__(self):
        return f"{self.code} — {self.name}"

class SemesterLoad(models.Model):
    program    = models.ForeignKey(DegreeProgram, on_delete=models.CASCADE)
    year_level = models.IntegerField()
    semester   = models.IntegerField()
    max_units  = models.IntegerField()

    class Meta:
        unique_together = ['program', 'year_level', 'semester']

    def __str__(self):
        return f"{self.program.code} Y{self.year_level}S{self.semester} — {self.max_units} units"

class AcademicTerm(models.Model):
    school_year = models.CharField(max_length=20)
    semester    = models.IntegerField()
    is_active   = models.BooleanField(default=False)
    start_date  = models.DateField()
    end_date    = models.DateField()

    class Meta:
        unique_together = ['school_year', 'semester']

    def save(self, *args, **kwargs):
        if self.is_active:
            AcademicTerm.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"AY {self.school_year} — Sem {self.semester}"

def generate_offer_code():
    from django.db.models import Max
    result = SubjectOffering.objects.aggregate(max_code=Max('offer_code'))
    last   = result['max_code']
    if not last:
        return '10001'
    return str(int(last) + 1).zfill(5)

class SubjectOffering(models.Model):
    term          = models.ForeignKey(AcademicTerm, on_delete=models.CASCADE, related_name='offerings')
    discipline    = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='offerings')
    teacher       = models.ForeignKey(TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='offerings')
    offer_code    = models.CharField(max_length=5, unique=True, editable=False)
    schedule      = models.CharField(max_length=100)
    room          = models.CharField(max_length=50, blank=True)
    max_slots     = models.IntegerField(default=40)
    current_slots = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.offer_code:
            self.offer_code = generate_offer_code()
        super().save(*args, **kwargs)

    @property
    def available_slots(self):
        return self.max_slots - self.current_slots

    def __str__(self):
        return f"{self.offer_code} — {self.discipline.code} ({self.schedule})"


class StudentEnrollment(models.Model):
    """
    Stage 1 — discipline request:
        offering=None, status=PENDING → admin sets APPROVED or REJECTED

    Stage 2 — schedule selection:
        offering set by student from approved offerings for that discipline,
        status moves to ENROLLED, slot count increments on the offering
    """

    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'Pending'
        APPROVED  = 'APPROVED',  'Approved'   # discipline approved, no schedule yet
        ENROLLED  = 'ENROLLED',  'Enrolled'   # schedule locked in
        DROPPED   = 'DROPPED',   'Dropped'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        REJECTED  = 'REJECTED',  'Rejected'
        COMPLETED = 'COMPLETED', 'Completed'

    student    = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='enrollments')
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='enrollment_requests', default='')
    offering   = models.ForeignKey(
        SubjectOffering, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='enrollments'
    )
    term        = models.ForeignKey(AcademicTerm, on_delete=models.CASCADE, related_name='enrollments', default='')
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'discipline', 'term']

    def __str__(self):
        offering_str = self.offering.offer_code if self.offering else 'no schedule'
        return f"{self.student} → {self.discipline.code} ({offering_str})"


class Grade(models.Model):
    student    = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE)
    teacher    = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    term       = models.ForeignKey(AcademicTerm, on_delete=models.CASCADE, null=True, blank=True)
    offering   = models.ForeignKey(SubjectOffering, on_delete=models.SET_NULL, null=True, blank=True)
    prelim     = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    midterm    = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    finals     = models.DecimalField(max_digits=3, decimal_places=2)

    class Meta:
        unique_together = ['student', 'discipline', 'term']

    @property
    def final_grade(self):
        grades = [g for g in [self.prelim, self.midterm, self.finals] if g is not None]
        return sum(grades) / len(grades)

    @property
    def passed(self):
        return self.final_grade <= 3.0

    @property
    def failed(self):
        return self.final_grade > 3.0