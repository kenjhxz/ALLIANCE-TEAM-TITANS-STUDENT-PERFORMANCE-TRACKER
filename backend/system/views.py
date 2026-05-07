from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .serializers import (
    DegreeProgramSerializer, CollegeSerializer, DisciplineSerializer,
    SemesterLoadSerializer, AcademicTermSerializer,
    SubjectOfferingSerializer, AdminCreateOfferingSerializer,
    EnrollmentSerializer, DisciplineRequestSerializer, ScheduleSelectSerializer, GradeSerializer
)
from .models import (
    DegreeProgram, College, Discipline, SemesterLoad,
    AcademicTerm, SubjectOffering, StudentEnrollment, Grade
)
from profiles.views import IsAdmin, IsStudent, IsAdminOrReadOnly, IsTeacher
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
import csv

# ── School setup ──────────────────────────────────────────────────────────────

class CollegeView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(CollegeSerializer(College.objects.all(), many=True).data)

    def post(self, request):
        s = CollegeSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class DegreeProgramView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = DegreeProgram.objects.all()
        college_id = request.query_params.get('college')
        if college_id:
            qs = qs.filter(college_id=college_id)
        return Response(DegreeProgramSerializer(qs, many=True).data)

    def post(self, request):
        s = DegreeProgramSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class DisciplineView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = Discipline.objects.all().prefetch_related('prerequisites')
        college_id = request.query_params.get('college')
        program_id = request.query_params.get('program')
        if college_id:
            qs = qs.filter(program__college_id=college_id)
        if program_id:
            qs = qs.filter(program_id=program_id)
        return Response(DisciplineSerializer(qs, many=True).data)

    def post(self, request):
        s = DisciplineSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class SemesterLoadView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = SemesterLoad.objects.select_related('program').all()
        college_id = request.query_params.get('college')
        program_id = request.query_params.get('program')
        if college_id:
            qs = qs.filter(program__college_id=college_id)
        if program_id:
            qs = qs.filter(program_id=program_id)
        return Response(SemesterLoadSerializer(qs, many=True).data)

    def post(self, request):
        s = SemesterLoadSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Academic Term ─────────────────────────────────────────────────────────────

class AcademicTermView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class   = AcademicTermSerializer
    queryset           = AcademicTerm.objects.all().order_by('-school_year', 'semester')


class AcademicTermDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class   = AcademicTermSerializer
    queryset           = AcademicTerm.objects.all()


# ── Subject Offerings ─────────────────────────────────────────────────────────

class SubjectOfferingView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateOfferingSerializer
        return SubjectOfferingSerializer

    def get_queryset(self):
        qs = SubjectOffering.objects.select_related(
            'term', 'discipline', 'discipline__program', 'teacher__user'
        )
        params = self.request.query_params
        if params.get('term'):       qs = qs.filter(term_id=params['term'])
        if params.get('discipline'): qs = qs.filter(discipline_id=params['discipline'])
        if params.get('program'):    qs = qs.filter(discipline__program_id=params['program'])
        if params.get('year_level'): qs = qs.filter(discipline__year_level=params['year_level'])
        if params.get('semester'):   qs = qs.filter(discipline__semester=params['semester'])
        return qs


# ── ENROLLMENT: Stage 1 — Discipline request (Student) ───────────────────────

class StudentDisciplineRequestView(APIView):
    """
    GET  — returns the student's prospectus for the active term's semester,
            annotated with their current request status if any.
    POST — submit discipline IDs to request enrollment.
    """
    permission_classes = [IsStudent]

    def _get_profile_and_term(self, request):
        try:
            profile = request.user.studentprofile
        except Exception:
            return None, None, Response({'error': 'Student profile not found.'}, status=400)

        term = AcademicTerm.objects.filter(is_active=True).first()
        if not term:
            return None, None, Response({'error': 'No active enrollment period.'}, status=400)

        return profile, term, None

    def get(self, request):
        profile, term, err = self._get_profile_and_term(request)
        if err:
            return err

        # disciplines for this student's program and year level in the active semester
        disciplines = Discipline.objects.filter(
            program=profile.program,
            year_level=profile.year_level,
            semester=term.semester,
        ).prefetch_related('prerequisites')

        # existing requests this term keyed by discipline id
        existing = StudentEnrollment.objects.filter(
            student=profile, term=term,
            discipline__in=disciplines,
        ).select_related('offering')

        status_map = {e.discipline_id: e for e in existing}

        data = []
        for d in disciplines:
            enrollment = status_map.get(d.id)
            data.append({
                'discipline_id':   d.id,
                'code':            d.code,
                'name':            d.name,
                'units':           d.units,
                'prerequisites':   [p.code for p in d.prerequisites.all()],
                'request_status':  enrollment.status if enrollment else None,
                'enrollment_id':   enrollment.id if enrollment else None,
                'offer_code':      enrollment.offering.offer_code if enrollment and enrollment.offering else None,
            })

        return Response(data)

    def post(self, request):
        profile, term, err = self._get_profile_and_term(request)
        if err:
            return err

        s = DisciplineRequestSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        discipline_ids = s.validated_data['discipline_ids']
        disciplines    = Discipline.objects.filter(
            id__in=discipline_ids,
            program=profile.program,
            year_level=profile.year_level,
            semester=term.semester,
        )

        if disciplines.count() != len(discipline_ids):
            return Response(
                {'error': 'One or more disciplines are invalid for your program/year/semester.'},
                status=400,
            )

        # unit cap check
        existing_units = StudentEnrollment.objects.filter(
            student=profile, term=term,
            discipline__year_level=profile.year_level,
            discipline__semester=term.semester,
            status__in=[
                StudentEnrollment.Status.PENDING,
                StudentEnrollment.Status.APPROVED,
                StudentEnrollment.Status.ENROLLED,
            ],
        ).aggregate(total=Sum('discipline__units'))['total'] or 0

        new_units = sum(d.units for d in disciplines)

        try:
            load      = SemesterLoad.objects.get(
                program=profile.program,
                year_level=profile.year_level,
                semester=term.semester,
            )
            max_units = load.max_units
        except SemesterLoad.DoesNotExist:
            max_units = 27

        if existing_units + new_units > max_units:
            return Response(
                {'error': f'Unit cap exceeded. You have {existing_units} units already requested. Max is {max_units}.'},
                status=400,
            )

        # prerequisite check
        errors  = []
        created = []

        passed_discipline_ids = set(
            Grade.objects.filter(
                student=profile, finals__lte=3.0
            ).values_list('discipline_id', flat=True)
        ) if True else set()  

        for discipline in disciplines:
            prereqs = discipline.prerequisites.all()
            unmet   = [p.code for p in prereqs if p.id not in passed_discipline_ids]
            if unmet:
                errors.append(f"{discipline.code}: prerequisites not met — {', '.join(unmet)}")
                continue

            enrollment, created_flag = StudentEnrollment.objects.get_or_create(
                student=profile, discipline=discipline, term=term,
                defaults={'status': StudentEnrollment.Status.PENDING},
            )
            if created_flag:
                created.append(discipline.code)
            else:
                errors.append(f"{discipline.code}: already requested (status: {enrollment.status}).")

        return Response(
            {'requested': created, 'errors': errors},
            status=201 if created else 400,
        )


# ── ENROLLMENT: Stage 2 — Schedule selection (Student) ───────────────────────

class StudentScheduleSelectView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            profile = request.user.studentprofile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=400)

        term = AcademicTerm.objects.filter(is_active=True).first()
        if not term:
            return Response({'error': 'No active term.'}, status=400)

        approved = StudentEnrollment.objects.filter(
            student=profile, term=term,
            status=StudentEnrollment.Status.APPROVED,
            offering__isnull=True,
        ).select_related('discipline')

        data = []
        for enrollment in approved:
            offerings = SubjectOffering.objects.filter(
                term=term,
                discipline=enrollment.discipline,
            ).select_related('teacher__user')

            data.append({
                'enrollment_id':   enrollment.id,
                'discipline_id':   enrollment.discipline.id,
                'discipline_code': enrollment.discipline.code,
                'discipline_name': enrollment.discipline.name,
                'units':           enrollment.discipline.units,
                'offerings':       SubjectOfferingSerializer(offerings, many=True).data,
            })

        return Response(data)

    def post(self, request):
        try:
            profile = request.user.studentprofile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=400)

        s = ScheduleSelectSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        enrollment_id = s.validated_data['enrollment_id']
        offering_id   = s.validated_data['offering_id']

        try:
            enrollment = StudentEnrollment.objects.select_related('discipline').get(
                id=enrollment_id,
                student=profile,
                status=StudentEnrollment.Status.APPROVED,
                offering__isnull=True,
            )
        except StudentEnrollment.DoesNotExist:
            return Response({'error': 'Enrollment not found or not eligible for schedule selection.'}, status=404)

        try:
            offering = SubjectOffering.objects.get(
                id=offering_id,
                discipline=enrollment.discipline,
            )
        except SubjectOffering.DoesNotExist:
            return Response({'error': 'Offering not found or does not match discipline.'}, status=404)

        if offering.available_slots <= 0:
            return Response({'error': f'{offering.offer_code} has no available slots.'}, status=400)

        # lock in the schedule
        enrollment.offering = offering
        enrollment.status   = StudentEnrollment.Status.ENROLLED
        enrollment.save()

        offering.current_slots += 1
        offering.save()

        return Response({
            'enrolled':   enrollment.id,
            'offer_code': offering.offer_code,
            'schedule':   offering.schedule,
            'room':       offering.room,
        })


# ── ENROLLMENT: Admin queue ───────────────────────────────────────────────────

class AdminEnrollmentQueueView(APIView):
    """
    GET   — list enrollments filtered by status (default: PENDING).
    PATCH — approve or reject a list of enrollment IDs.
            Approving sets status=APPROVED (no slot increment yet).
            Slot increments only when student locks in a schedule.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', 'PENDING')
        qs = StudentEnrollment.objects.filter(
            status=status_filter
        ).select_related(
            'student__user', 'discipline', 'offering__discipline', 'term'
        ).order_by('student__student_id', 'discipline__year_level', 'discipline__semester')
        return Response(EnrollmentSerializer(qs, many=True).data)

    def patch(self, request):
        enrollment_ids = request.data.get('enrollment_ids', [])
        action         = request.data.get('action')

        if action not in ['APPROVED', 'REJECTED']:
            return Response({'error': "action must be 'APPROVED' or 'REJECTED'."}, status=400)

        enrollments = StudentEnrollment.objects.filter(
            id__in=enrollment_ids,
            status=StudentEnrollment.Status.PENDING,
        )

        updated = []
        for enrollment in enrollments:
            enrollment.status = action
            enrollment.save()
            updated.append(enrollment.id)

        return Response({'updated': updated, 'action': action})




class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    def get_permissions(self):
        # Safe methods (GET, HEAD, OPTIONS) allowed for authenticated users.
        # Unsafe methods (POST, PUT, PATCH, DELETE) require professor role.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsTeacher()]

    def get_queryset(self):
        # Default queryset; allow filtering by student, offering, term, or teacher
        qs = Grade.objects.select_related('student__user', 'discipline', 'teacher__user', 'term', 'offering')
        params = self.request.query_params
        if params.get('student'):
            qs = qs.filter(student_id=params.get('student'))
        if params.get('offering'):
            offering = params.get('offering')
            if str(offering).isdigit():
                qs = qs.filter(offering_id=offering)
            else:
                qs = qs.filter(offering__offer_code=offering)
        if params.get('term'):
            qs = qs.filter(term_id=params.get('term'))
        if params.get('teacher'):
            qs = qs.filter(teacher_id=params.get('teacher'))
        return qs

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        # IMPORTANT: student is usually request.user.studentprofile
        try:
            student = request.user.studentprofile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=400)

        grades = Grade.objects.filter(student=student)
        serializer = self.get_serializer(grades, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # ensure the requester is a professor and set the teacher automatically
        try:
            teacher = self.request.user.teacherprofile
        except Exception:
            raise PermissionDenied('Teacher profile not found.')

        offering = serializer.validated_data.get('offering')
        if offering and offering.teacher_id and offering.teacher_id != teacher.id:
            # only the assigned teacher may post grades for this offering
            raise PermissionDenied('You are not assigned to this offering.')

        serializer.save(teacher=teacher)

    def perform_update(self, serializer):
        try:
            teacher = self.request.user.teacherprofile
        except Exception:
            raise PermissionDenied('Teacher profile not found.')

        offering = serializer.validated_data.get('offering', getattr(self.get_object(), 'offering', None))
        if offering and offering.teacher_id and offering.teacher_id != teacher.id:
            raise PermissionDenied('You are not assigned to this offering.')

        serializer.save(teacher=teacher)

    @action(detail=False, methods=['get'], url_path='export', permission_classes=[IsStudent])
    def export(self, request):
        try:
            student = request.user.studentprofile
        except Exception:
            return Response({'error': 'Student profile not found.'}, status=400)

        grades = Grade.objects.filter(student=student).select_related('discipline', 'term', 'offering')

        # build CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="grades.csv"'
        writer = csv.writer(response)
        writer.writerow(['Offer Code', 'Term', 'Discipline Code', 'Discipline Name', 'Units', 'Prelim', 'Midterm', 'Finals', 'Final Grade', 'Passed'])
        for g in grades:
            offer = g.offering.offer_code if g.offering else ''
            term = str(g.term) if g.term else ''
            final = float(g.final_grade) if g.final_grade is not None else ''
            writer.writerow([offer, term, g.discipline.code, g.discipline.name, g.discipline.units, g.prelim, g.midterm, g.finals, final, g.passed])
        return response


class TeacherOfferingsView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        try:
            teacher = request.user.teacherprofile
        except Exception:
            return Response({'error': 'Teacher profile not found.'}, status=400)

        offerings = SubjectOffering.objects.filter(teacher=teacher).select_related('discipline', 'term')
        return Response(SubjectOfferingSerializer(offerings, many=True).data)


class TeacherOfferingEnrollmentsView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request, offering_id):
        try:
            teacher = request.user.teacherprofile
        except Exception:
            return Response({'error': 'Teacher profile not found.'}, status=400)

        try:
            offering = SubjectOffering.objects.get(id=offering_id)
        except SubjectOffering.DoesNotExist:
            return Response({'error': 'Offering not found.'}, status=404)

        if offering.teacher_id != teacher.id:
            return Response({'error': 'Not allowed for this offering.'}, status=403)

        enrollments = StudentEnrollment.objects.filter(offering=offering, status=StudentEnrollment.Status.ENROLLED).select_related('student__user', 'discipline')
        return Response(EnrollmentSerializer(enrollments, many=True).data)