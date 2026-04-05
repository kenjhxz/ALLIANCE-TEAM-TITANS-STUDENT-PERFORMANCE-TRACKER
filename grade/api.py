from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from grade.models import Grade
from grade.serializers import GradeSerializer


class GradeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_student:
            grades = Grade.objects.filter(student__user=request.user)
        elif request.user.is_teacher:
            grades = Grade.objects.filter(teacher__user=request.user)
        elif request.user.is_admin or request.user.is_superuser:
            grades = Grade.objects.all()
        else:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GradeSerializer(grades, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_teacher and not request.user.is_admin:
            return Response({'detail': 'Only teachers or admins can add grades.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = GradeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
