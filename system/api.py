from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication


#imports from apps
from system.models import User, DegreeProgram, College, Discipline
from user.models import Teacher
from user.serializers import TeacherSerializer, StudentSerializer
from system.serializers import DisciplineSerializer, DegreeProgramSerializer, CollegeSerializer

#perms
from rest_framework.permissions import AllowAny

class IsAdminPerm(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin and request.user.is_superuser)


#for REACT UI classes here:
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error':'Please provide both username and password.'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username,password=password)

        if not user:
            return Response({'error':'Invalid credentials.'}, 
                            status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)

        profile = None
        if user.is_teacher:
            profile = TeacherSerializer(user.teacher).data
        elif user.is_student:
            profile = StudentSerializer(user.student).data

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'is_teacher': user.is_teacher,
            'is_student': user.is_student,
            'is_admin': user.is_superuser,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile': profile
        })
    

#if BSCS, BSCIT, etc
class DegreeProgramView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes= [IsAdminPerm]

    def get (self, request):
        college_id = request.query_params.get('college')

        if college_id:
            programs = DegreeProgram.objects.filter(college_id=college_id)
        else:
            programs = DegreeProgram.objects.all()
        program_data = DegreeProgramSerializer(programs, many=True)
        return Response(program_data.data)
    
    def post (self, request):
        program_data = DegreeProgramSerializer(data=request.data)

        if program_data.is_valid():
            program_data.save()
            return Response(program_data.data, status=status.HTTP_201_CREATED)
        
        print("Errors:", program_data.errors) 
        return Response(program_data.errors, status=status.HTTP_400_BAD_REQUEST)
    

#college -> if school of computer studies, school of engineering, etc
class CollegeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminPerm]
    
    def get (self, request):
        colleges = College.objects.all()
        college_data = CollegeSerializer(colleges, many=True)
        return Response(college_data.data)
    
    def post (self, request):
        college_data = CollegeSerializer(data = request.data)

        if college_data.is_valid():
            college_data.save()
            return Response(college_data.data, status=status.HTTP_201_CREATED)
        return Response(college_data.errors, status=status.HTTP_400_BAD_REQUEST)


class DisciplineView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminPerm]

    def get (self, request):
        college_id = request.query_params.get('college')
        program_id = request.query_params.get('program')
        disciplines = Discipline.objects.all()

        if college_id:
            disciplines = disciplines.objects.filter(program__college_id = college_id)
        if program_id:
            disciplines = disciplines.objects.filter(program_id=program_id)
        discipline_data = DisciplineSerializer(disciplines, many=True)
        return Response(discipline_data.data)
    
    def post (self, request):
        discipline_data = DisciplineSerializer(data=request.data)

        if discipline_data.is_valid():
            discipline_data.save()
            return Response(discipline_data.data, status=status.HTTP_201_CREATED)
        return Response(discipline_data.errors, status=status.HTTP_400_BAD_REQUEST)




#add teachers
class TeacherView(APIView):
    authentication_classes=[JWTAuthentication]
    permission_classes=[IsAdminPerm]


    def get (self,request):
        teachers = Teacher.objects.all()
        teacher_data = CollegeSerializer(teachers, many=True)
        return Response(teacher_data.data)
    

    def post (self,request):
        teacher_data = TeacherSerializer(data=request.data)

        if teacher_data.is_valid():
            teacher_data.save()
            return Response(teacher_data.data, status=status.HTTP_201_CREATED)
        return Response(teacher_data.errors, status=status.HTTP_400_BAD_REQUEST)
    

