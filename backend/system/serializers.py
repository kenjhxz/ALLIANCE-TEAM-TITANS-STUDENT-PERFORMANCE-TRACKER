from rest_framework import serializers
from .models import (
    Discipline, DegreeProgram, College, SemesterLoad,
    Grade, AcademicTerm, StudentEnrollment, SubjectOffering,
)


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = College
        fields = ['id', 'name', 'code']


class DegreeProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DegreeProgram
        fields = ['id', 'college', 'name', 'code']


class DisciplineSerializer(serializers.ModelSerializer):
    program_name  = serializers.CharField(source='program.name', read_only=True)
    prerequisites = serializers.PrimaryKeyRelatedField(
        queryset=Discipline.objects.all(), many=True, required=False
    )

    class Meta:
        model  = Discipline
        fields = [
            'id', 'program', 'program_name',
            'code', 'name',
            'year_level', 'semester', 'units',
            'prerequisites',
        ]

    def create(self, validated_data):
        prerequisites = validated_data.pop('prerequisites', [])
        discipline    = Discipline.objects.create(**validated_data)
        if prerequisites:
            discipline.prerequisites.set(prerequisites)
        return discipline


class SemesterLoadSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    program_code = serializers.CharField(source='program.code', read_only=True)
    disciplines  = serializers.SerializerMethodField()

    class Meta:
        model  = SemesterLoad
        fields = [
            'id', 'program', 'program_name', 'program_code',
            'year_level', 'semester', 'max_units', 'disciplines',
        ]

    def get_disciplines(self, obj):
        discs = Discipline.objects.filter(
            program=obj.program,
            year_level=obj.year_level,
            semester=obj.semester,
        )
        return [{'id': d.id, 'name': d.name, 'code': d.code, 'units': d.units} for d in discs]


class GradeSerializer(serializers.ModelSerializer):
    student_id_no = serializers.CharField(source='student.student_id', read_only=True)
    student_name  = serializers.SerializerMethodField()
    discipline_code = serializers.CharField(source='discipline.code', read_only=True)
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    units           = serializers.IntegerField(source='discipline.units', read_only=True)

    semester   = serializers.IntegerField(source='discipline.semester', read_only=True)
    year_level = serializers.IntegerField(source='discipline.year_level', read_only=True)

    term_label = serializers.SerializerMethodField()
    offer_code = serializers.CharField(source='offering.offer_code', read_only=True, default=None)

    class Meta:
        model = Grade
        fields = [
            'student',
            'student_id_no',
            'student_name',
            'id',
            'discipline',
            'discipline_code',
            'discipline_name',
            'units',

            'semester',
            'year_level',

            'prelim',
            'midterm',
            'finals',

            'term',
            'term_label',
            'offering',
            'offer_code',
        ]

    def validate(self, attrs):
        for key in ('prelim', 'midterm', 'finals'):
            value = attrs.get(key, getattr(self.instance, key, None) if self.instance else None)
            if value is None:
                if key == 'finals':
                    raise serializers.ValidationError({key: 'Finals grade is required.'})
                continue
            try:
                numeric = float(value)
            except (TypeError, ValueError):
                raise serializers.ValidationError({key: 'Grade must be a number.'})
            if numeric < 1.0 or numeric > 5.0:
                raise serializers.ValidationError({key: 'Grade must be between 1.00 and 5.00.'})

        offering = attrs.get('offering', getattr(self.instance, 'offering', None) if self.instance else None)
        term = attrs.get('term', getattr(self.instance, 'term', None) if self.instance else None)
        discipline = attrs.get('discipline', getattr(self.instance, 'discipline', None) if self.instance else None)

        if offering and term and offering.term_id != term.id:
            raise serializers.ValidationError({'term': 'Selected term does not match the offering term.'})
        if offering and discipline and offering.discipline_id != discipline.id:
            raise serializers.ValidationError({'discipline': 'Selected discipline does not match the offering discipline.'})

        return attrs

    def get_term_label(self, obj):
        if obj.term:
            return f"{obj.term.school_year} - Semester {obj.term.semester}"
        return None

    def get_student_name(self, obj):
        u = obj.student.user
        mid = f" {u.middle_name}" if getattr(u, 'middle_name', None) else ""
        return f"{u.first_name}{mid} {u.last_name}"
class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AcademicTerm
        fields = ['id', 'school_year', 'semester', 'is_active', 'start_date', 'end_date']


class SubjectOfferingSerializer(serializers.ModelSerializer):
    discipline_name  = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code  = serializers.CharField(source='discipline.code', read_only=True)
    discipline_units = serializers.IntegerField(source='discipline.units', read_only=True)
    teacher_name     = serializers.SerializerMethodField()
    available_slots  = serializers.IntegerField(read_only=True)
    term_label       = serializers.SerializerMethodField()

    class Meta:
        model  = SubjectOffering
        fields = [
            'id', 'offer_code', 'term', 'term_label',
            'discipline', 'discipline_name', 'discipline_code', 'discipline_units',
            'teacher', 'teacher_name',
            'schedule', 'room',
            'max_slots', 'current_slots', 'available_slots',
        ]

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return None
        u = obj.teacher.user
        return f"{u.first_name} {u.last_name}"

    def get_term_label(self, obj):
        return str(obj.term)


class AdminCreateOfferingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SubjectOffering
        fields = ['term', 'discipline', 'teacher', 'schedule', 'room', 'max_slots']



class EnrollmentSerializer(serializers.ModelSerializer):
    student_name    = serializers.SerializerMethodField()
    student_id      = serializers.IntegerField(source='student.id', read_only=True)
    student_id_no   = serializers.CharField(source='student.student_id', read_only=True)
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code = serializers.CharField(source='discipline.code', read_only=True)
    discipline_id   = serializers.IntegerField(source='discipline.id', read_only=True)
    discipline_units = serializers.IntegerField(source='discipline.units', read_only=True)
    year_level      = serializers.IntegerField(source='discipline.year_level', read_only=True)
    semester        = serializers.IntegerField(source='discipline.semester', read_only=True)
    term_label      = serializers.CharField(source='term.__str__', read_only=True)
    offer_code      = serializers.CharField(source='offering.offer_code', read_only=True, default=None)
    schedule        = serializers.CharField(source='offering.schedule', read_only=True, default=None)
    room            = serializers.CharField(source='offering.room', read_only=True, default=None)
    teacher_name    = serializers.SerializerMethodField()

    class Meta:
        model  = StudentEnrollment
        fields = [
            'id', 'student_name', 'student_id', 'student_id_no',
            'discipline_name', 'discipline_code', 'discipline_id', 'discipline_units',
            'year_level', 'semester', 'term_label',
            'offer_code', 'schedule', 'room', 'teacher_name',
            'status', 'enrolled_at',
        ]

    def get_student_name(self, obj):
        u   = obj.student.user
        mid = f" {u.middle_name}" if getattr(u, 'middle_name', None) else ""
        return f"{u.first_name}{mid} {u.last_name}"

    def get_teacher_name(self, obj):
        if not obj.offering or not obj.offering.teacher:
            return None
        u = obj.offering.teacher.user
        return f"{u.first_name} {u.last_name}"


class DisciplineRequestSerializer(serializers.Serializer):
    discipline_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )


class ScheduleSelectSerializer(serializers.Serializer):
    enrollment_id = serializers.IntegerField()
    offering_id   = serializers.IntegerField()


class ProspectusRowSerializer(serializers.ModelSerializer):
    prerequisites  = serializers.SerializerMethodField()
    request_status = serializers.SerializerMethodField()
    offer_code     = serializers.SerializerMethodField()
    enrollment_id  = serializers.SerializerMethodField()

    class Meta:
        model  = Discipline
        fields = ['id', 'name', 'code', 'units', 'year_level', 'semester',
                  'prerequisites', 'request_status', 'offer_code', 'enrollment_id']

    def _get_enrollment(self, obj):
        request = self.context.get('request')
        term    = self.context.get('active_term')
        if not request or not term: return None
        try:
            profile = request.user.studentprofile
            return StudentEnrollment.objects.filter(
                student=profile, discipline=obj, term=term
            ).first()
        except: return None

    def get_prerequisites(self, obj):
        return list(obj.prerequisites.values_list('code', flat=True))

    def get_request_status(self, obj):
        enr = self._get_enrollment(obj)
        return enr.status if enr else None

    def get_offer_code(self, obj):
        enr = self._get_enrollment(obj)
        return enr.offering.offer_code if enr and enr.offering else None

    def get_enrollment_id(self, obj):
        enr = self._get_enrollment(obj)
        return enr.id if enr else None


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    student_name     = serializers.SerializerMethodField()
    student_id_no    = serializers.CharField(source='student.student_id', read_only=True)
    program          = serializers.CharField(source='student.program.code', read_only=True)
    discipline_name  = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code  = serializers.CharField(source='discipline.code', read_only=True)
    units            = serializers.IntegerField(source='discipline.units', read_only=True)

    class Meta:
        model  = StudentEnrollment
        fields = [
            'id', 'student_name', 'student_id_no', 'program',
            'discipline_name', 'discipline_code', 'units',
            'status', 'enrolled_at',
        ]

    def get_student_name(self, obj):
        u   = obj.student.user
        mid = f" {u.middle_name}" if getattr(u, 'middle_name', None) else ""
        return f"{u.first_name}{mid} {u.last_name}"
    

class ApprovedForScheduleSerializer(serializers.ModelSerializer):
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code = serializers.CharField(source='discipline.code', read_only=True)
    units           = serializers.IntegerField(source='discipline.units', read_only=True)
    offerings       = serializers.SerializerMethodField()

    class Meta:
        model  = StudentEnrollment
        fields = ['id', 'discipline_name', 'discipline_code', 'units', 'offerings']

    def get_offerings(self, obj):
        term      = self.context.get('active_term')
        offerings = SubjectOffering.objects.filter(discipline=obj.discipline, term=term)
        return SubjectOfferingSerializer(offerings, many=True).data