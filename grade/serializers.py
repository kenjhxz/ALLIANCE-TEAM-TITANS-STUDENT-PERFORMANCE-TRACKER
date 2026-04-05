from rest_framework import serializers
from grade.models import Grade

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.__str__', read_only=True)
    teacher_name = serializers.CharField(source='teacher.__str__', read_only=True)
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id',
            'student',
            'student_name',
            'teacher',
            'teacher_name',
            'discipline',
            'discipline_name',
            'score',
            'remarks',
            'date_recorded',
        ]
        read_only_fields = ['date_recorded']
