from rest_framework import serializers
from user.models import Student, Teacher
from system.models import College, Discipline
from system.serializers import DisciplineSerializer 

#here we define the variables for each class 
#that we are going to JSONify for the API requesting in the REACT side

class StudentSerializer(serializers.ModelSerializer):

    course_name = serializers.CharField(
        source="course.name",
        read_only=True
    )

    class Meta:
        model = Student
        fields = '__all__' 
  


class TeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    department = serializers.PrimaryKeyRelatedField(queryset=College.objects.all())
    discipline = serializers.PrimaryKeyRelatedField(many=True, queryset=Discipline.objects.all())

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    discipline_names = DisciplineSerializer(
        source="discipline",
        many=True,
        read_only=True
    )

    class Meta:
        model = Teacher
        fields = '__all__'

    def get_teacher_name(self, obj):
        return str(obj)
    
    
    def validate(self, data):
        selected_department = data.get('department')
        selected_disciplines = data.get('discipline', [])

        for d in selected_disciplines:
            if d.college != selected_department:
                raise serializers.ValidationError(
                     f"Discipline '{d.name}' does not belong to {selected_department.name}."
                )
        return data