from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
import logging
logger = logging.getLogger(__name__)


from .serializers import (
    DegreeProgramSerializer, CollegeSerializer, DisciplineSerializer,
    SemesterLoadSerializer, AcademicTermSerializer,
    SubjectOfferingSerializer, AdminCreateOfferingSerializer,
    EnrollmentSerializer, DisciplineRequestSerializer, ScheduleSelectSerializer, GradeSerializer,
    GradeHistorySerializer
)
from .models import (
    DegreeProgram, College, Discipline, SemesterLoad,
    AcademicTerm, SubjectOffering, StudentEnrollment, Grade, GradeHistory
)
from profiles.views import IsAdmin, IsStudent, IsAdminOrReadOnly, IsTeacher
from profiles.utils import create_notification, send_grade_update_email
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
import csv
from profiles.models import AuditLog
from openpyxl import Workbook

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

    def perform_create(self, serializer):
        offering = serializer.save()
        if offering.teacher:
            create_notification(
                offering.teacher.user,
                title='New subject offering assigned',
                message=(
                    f'You have been assigned to {offering.discipline.code} '
                    f'({offering.discipline.name}) for {offering.term}.'
                ),
                category='OFFERING',
                payload={
                    'offering_id': offering.id,
                    'discipline_id': offering.discipline_id,
                    'term_id': offering.term_id,
                    'offer_code': offering.offer_code,
                },
            )


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
            enrollment = StudentEnrollment.objects.select_related('discipline', 'term').get(
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

        if StudentEnrollment.objects.filter(
            student=profile,
            discipline=enrollment.discipline,
            term=enrollment.term,
            status=StudentEnrollment.Status.ENROLLED,
        ).exists():
            return Response(
                {'error': f'You are already enrolled in {enrollment.discipline.code} this term.'},
                status=400,
            )

        # slots check
        if offering.available_slots <= 0:
            return Response({'error': f'{offering.offer_code} has no available slots.'}, status=400)

        # schedule clash check
        clashing = StudentEnrollment.objects.filter(
            student=profile,
            term=enrollment.term,
            status=StudentEnrollment.Status.ENROLLED,
        ).select_related('offering', 'discipline').exclude(offering__isnull=True)

        for existing in clashing:
            if existing.offering.schedule == offering.schedule:
                return Response(
                    {
                        'error': (
                            f'Schedule conflict: "{offering.schedule}" clashes with '
                            f'{existing.offering.offer_code} ({existing.discipline.code}).'
                        )
                    },
                    status=400,
                )

        # lock in the schedule
        enrollment.offering = offering
        enrollment.status   = StudentEnrollment.Status.ENROLLED
        enrollment.save()

        offering.current_slots += 1
        offering.save()

        logger.info(
            f"[AUDIT] ENROLL | student={profile.student_id} | "
            f"discipline={enrollment.discipline.code} | offering={offering.offer_code} | "
            f"schedule={offering.schedule}"
        )

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

            create_notification(
                enrollment.student.user,
                title=f'Enrollment {action.lower()}',
                message=(
                    f'Your request for {enrollment.discipline.code} '
                    f'({enrollment.discipline.name}) was {action.lower()}.'
                ),
                category='ENROLLMENT',
                payload={
                    'enrollment_id': enrollment.id,
                    'discipline_id': enrollment.discipline_id,
                    'status': action,
                },
            )

        return Response({'updated': updated, 'action': action})




class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    def get_permissions(self):
        # Safe methods (GET, HEAD, OPTIONS) allowed for authenticated users.
        # Unsafe methods (POST, PUT, PATCH, DELETE) require professor or admin role.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        if not self.request.user.is_authenticated:
            return [IsAuthenticated()]
        return [IsTeacher() if self.request.user.role == 'PROFESSOR' else IsAdmin()]

    def _snapshot_grade(self, grade):
        def normalize(value):
            try:
                return float(value) if value is not None else None
            except (TypeError, ValueError):
                return value
        return {
            'prelim': normalize(grade.prelim),
            'midterm': normalize(grade.midterm),
            'finals': normalize(grade.finals),
            'remarks': grade.remarks,
            'teacher': grade.teacher_id,
            'student': grade.student_id,
            'discipline': grade.discipline_id,
            'term': grade.term_id,
            'offering': grade.offering_id,
        }

    def _notify_grade_change(self, grade, action):
        recipients = [grade.student.user]
        if grade.teacher and grade.teacher.user_id != grade.student.user_id:
            recipients.append(grade.teacher.user)

        term_label = str(grade.term) if grade.term else 'Current term'
        student_name = ''
        if grade.student and grade.student.user:
            student_user = grade.student.user
            student_name = f"{student_user.first_name} {student_user.last_name}".strip() or 'Student'

        title_map = {
            'created': 'Grade posted',
            'updated': 'Grade updated',
            'deleted': 'Grade removed',
        }
        message_map = {
            'created': f'{grade.discipline.code} has a new grade entry.',
            'updated': f'{grade.discipline.code} grade values were updated.',
            'deleted': f'{grade.discipline.code} grade entry was removed.',
        }

        for recipient in recipients:
            if grade.teacher and recipient.id == grade.teacher.user_id:
                teacher_message = (
                    f"Student: {student_name} · {grade.discipline.code} ({term_label})"
                    if action != 'deleted'
                    else f"Grade removed for {student_name} · {grade.discipline.code} ({term_label})"
                )
                message = teacher_message
            else:
                message = message_map[action]

            create_notification(
                recipient,
                title=title_map[action],
                message=message,
                category='GRADE',
                payload={
                    'grade_id': grade.id,
                    'discipline_id': grade.discipline_id,
                    'term_id': grade.term_id,
                    'action': action.upper(),
                },
            )

        if action in ('created', 'updated') and grade.teacher and grade.student and grade.student.user:
            student_user = grade.student.user
            teacher_user = grade.teacher.user
            updated_by = f"{teacher_user.first_name} {teacher_user.last_name}".strip()
            if student_user.email:
                send_grade_update_email(
                    email=student_user.email,
                    student_name=student_name or 'Student',
                    discipline_code=grade.discipline.code,
                    term_label=term_label,
                    updated_by=updated_by or 'Instructor',
                    action=action,
                )

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
        if params.get('discipline'):
            qs = qs.filter(discipline_id=params.get('discipline'))
        # Support filtering by grading period presence (prelim/midterm/finals)
        period = params.get('period')
        if period in ('prelim', 'midterm', 'finals'):
            lookup = {f"{period}__isnull": False}
            qs = qs.filter(**lookup)
        if params.get('teacher'):
            qs = qs.filter(teacher_id=params.get('teacher'))
        # Debug logging to help diagnose empty results from frontend
        try:
            logger.debug(f"GradeViewSet.get_queryset filters={dict(params)} count={qs.count()}")
        except Exception:
            logger.debug("GradeViewSet.get_queryset - could not compute count")
        return qs

    @action(detail=False, methods=['get'], url_path='debug-count', permission_classes=[IsAuthenticated])
    def debug_count(self, request):
        """Return the count of Grade rows matching the current query params."""
        qs = self.get_queryset()
        return Response({'count': qs.count(), 'filters': dict(request.query_params)})

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
        # allow teacher to post their own grades; admins can override
        user = self.request.user
        if user.role == 'PROFESSOR':
            try:
                teacher = user.teacherprofile
            except Exception:
                raise PermissionDenied('Teacher profile not found.')

            offering = serializer.validated_data.get('offering')
            if offering and offering.teacher_id and offering.teacher_id != teacher.id:
                raise PermissionDenied('You are not assigned to this offering.')

            grade = serializer.save(teacher=teacher)
        else:
            grade = serializer.save()

        GradeHistory.objects.create(
            grade=grade,
            changed_by=user,
            action=GradeHistory.Action.CREATED,
            previous=None,
            current=self._snapshot_grade(grade),
        )
        self._notify_grade_change(grade, 'created')
        AuditLog.objects.create(
            user=user,
            action='GRADE_CREATED',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            details={'grade_id': grade.id, 'student_id': grade.student_id},
        )

    def perform_update(self, serializer):
        user = self.request.user
        grade = self.get_object()
        previous = self._snapshot_grade(grade)

        if user.role == 'PROFESSOR':
            try:
                teacher = user.teacherprofile
            except Exception:
                raise PermissionDenied('Teacher profile not found.')

            offering = serializer.validated_data.get('offering', getattr(grade, 'offering', None))
            if offering and offering.teacher_id and offering.teacher_id != teacher.id:
                raise PermissionDenied('You are not assigned to this offering.')

            grade = serializer.save(teacher=teacher)
        else:
            grade = serializer.save()

        GradeHistory.objects.create(
            grade=grade,
            changed_by=user,
            action=GradeHistory.Action.UPDATED,
            previous=previous,
            current=self._snapshot_grade(grade),
        )
        self._notify_grade_change(grade, 'updated')
        AuditLog.objects.create(
            user=user,
            action='GRADE_UPDATED',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            details={'grade_id': grade.id, 'student_id': grade.student_id},
        )

    def perform_destroy(self, instance):
        previous = self._snapshot_grade(instance)
        user = self.request.user
        grade_id = instance.id
        student_id = instance.student_id
        instance.delete()
        GradeHistory.objects.create(
            grade_id=grade_id,
            changed_by=user,
            action=GradeHistory.Action.DELETED,
            previous=previous,
            current=None,
        )
        instance.teacher and self._notify_grade_change(instance, 'deleted')
        AuditLog.objects.create(
            user=user,
            action='GRADE_DELETED',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            details={'grade_id': grade_id, 'student_id': student_id},
        )

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        grade = self.get_object()
        if request.user.role == 'STUDENT':
            try:
                student = request.user.studentprofile
            except Exception:
                return Response({'error': 'Student profile not found.'}, status=400)
            if grade.student_id != student.id:
                return Response({'error': 'Not allowed.'}, status=403)

        history = grade.history.select_related('changed_by')
        return Response(GradeHistorySerializer(history, many=True).data)

    @action(detail=False, methods=['get'], url_path='timeline')
    def timeline(self, request):
        qs = GradeHistory.objects.select_related('grade', 'changed_by')
        if request.user.role == 'STUDENT':
            try:
                student = request.user.studentprofile
            except Exception:
                return Response({'error': 'Student profile not found.'}, status=400)
            qs = qs.filter(grade__student=student)
        student_id = request.query_params.get('student')
        if student_id:
            qs = qs.filter(grade__student_id=student_id)
        discipline_id = request.query_params.get('discipline')
        if discipline_id:
            qs = qs.filter(grade__discipline_id=discipline_id)
        return Response(GradeHistorySerializer(qs[:500], many=True).data)

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


class GradeReportView(APIView):
    permission_classes = [IsAdmin]

    def _filter(self, params):
        qs = Grade.objects.select_related('student__user', 'discipline', 'term', 'offering')
        if params.get('term'):
            qs = qs.filter(term_id=params.get('term'))
        if params.get('student'):
            qs = qs.filter(student_id=params.get('student'))
        if params.get('discipline'):
            qs = qs.filter(discipline_id=params.get('discipline'))
        if params.get('program'):
            qs = qs.filter(student__program_id=params.get('program'))
        if params.get('year_level'):
            qs = qs.filter(student__year_level=params.get('year_level'))
        return qs

    def get(self, request):
        qs = self._filter(request.query_params)
        data = GradeSerializer(qs, many=True).data
        graded = [g for g in data if g.get('finals') is not None]
        passing = len([g for g in graded if float(g['finals']) <= 3.0]) if graded else 0
        summary = {
            'total': len(data),
            'graded': len(graded),
            'passing': passing,
            'failing': len(graded) - passing,
        }
        return Response({'summary': summary, 'results': data})


class GradeReportExportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = GradeReportView()._filter(request.query_params)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="grade_report.csv"'
        writer = csv.writer(response)
        writer.writerow(['Student', 'Discipline', 'Term', 'Prelim', 'Midterm', 'Finals', 'Remarks'])
        for g in qs:
            writer.writerow([
                g.student.student_id,
                g.discipline.code,
                str(g.term) if g.term else '',
                g.prelim,
                g.midterm,
                g.finals,
                g.remarks,
            ])
        return response


class GradeReportExcelView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = GradeReportView()._filter(request.query_params)
        wb = Workbook()
        ws = wb.active
        ws.title = 'Grades'
        ws.append(['Student', 'Discipline', 'Term', 'Prelim', 'Midterm', 'Finals', 'Remarks'])
        for g in qs:
            ws.append([
                g.student.student_id,
                g.discipline.code,
                str(g.term) if g.term else '',
                g.prelim,
                g.midterm,
                g.finals,
                g.remarks,
            ])
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="grade_report.xlsx"'
        wb.save(response)
        return response