from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Department, Project, ImpactMetric, CommunityFeedback, BudgetVersion, AuditLog, FundAllocation, ProjectSpending
from .serializers import (
    DepartmentSerializer, DepartmentListSerializer, ProjectSerializer,
    ProjectListSerializer, ProjectCreateSerializer, ProjectUpdateSerializer,
    ImpactMetricSerializer, CommunityFeedbackSerializer, CommunityFeedbackCreateSerializer,
    BudgetVersionSerializer, AuditLogSerializer, DashboardMetricsSerializer,
    FundAllocationSerializer, FundAllocationCreateSerializer,
    ProjectSpendingSerializer, ProjectSpendingCreateSerializer
)
from .services import AnomalyDetectionService

User = get_user_model()


class DepartmentListView(generics.ListCreateAPIView):
    """View for listing and creating departments"""
    queryset = Department.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['head']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'budget', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DepartmentListSerializer
        return DepartmentSerializer


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for department details"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProjectListView(generics.ListCreateAPIView):
    """View for listing and creating projects"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['department', 'status', 'manager']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'budget', 'start_date', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin or user.is_auditor:
            return Project.objects.all()
        elif user.is_department_head and user.department:
            return Project.objects.filter(department=user.department)
        else:
            # For regular users, show all public projects or projects in their department
            if user.department:
                return Project.objects.filter(Q(is_public=True) | Q(department=user.department))
            else:
                return Project.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProjectListSerializer
        return ProjectCreateSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for project details"""
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectUpdateSerializer
        return ProjectSerializer


class ImpactMetricListView(generics.ListCreateAPIView):
    """View for listing and creating impact metrics"""
    queryset = ImpactMetric.objects.all()
    serializer_class = ImpactMetricSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project', 'metric_type', 'verified']
    ordering_fields = ['date', 'value']
    ordering = ['-date']


class ImpactMetricDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for impact metric details"""
    queryset = ImpactMetric.objects.all()
    serializer_class = ImpactMetricSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_metrics_view(request):
    """View for dashboard metrics"""
    # Calculate total budget
    total_budget = Department.objects.aggregate(
        total=Sum('budget')
    )['total'] or 0
    
    # Calculate utilized funds
    utilized_funds = Project.objects.aggregate(
        total=Sum('spent')
    )['total'] or 0
    
    # Count active projects
    active_projects = Project.objects.filter(status='active').count()
    
    # Count anomalies (this will be implemented in fund_flows app)
    anomalies_count = 0  # Placeholder
    
    metrics = {
        'totalBudget': float(total_budget),
        'utilizedFunds': float(utilized_funds),
        'activeProjects': active_projects,
        'anomaliesCount': anomalies_count,
    }
    
    return Response(metrics, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_projects_view(request, department_id):
    """View for getting projects by department"""
    try:
        department = Department.objects.get(id=department_id)
        projects = Project.objects.filter(department=department)
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Department.DoesNotExist:
        return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_impact_metrics_view(request, project_id):
    """View for getting impact metrics by project"""
    try:
        project = Project.objects.get(id=project_id)
        metrics = ImpactMetric.objects.filter(project=project)
        serializer = ImpactMetricSerializer(metrics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_impact_metric_view(request, metric_id):
    """View for verifying impact metrics"""
    try:
        metric = ImpactMetric.objects.get(id=metric_id)
        if not request.user.is_auditor:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        metric.verified = True
        metric.verified_by = request.user
        metric.save()
        
        return Response({'message': 'Impact metric verified successfully'}, status=status.HTTP_200_OK)
    except ImpactMetric.DoesNotExist:
        return Response({'error': 'Impact metric not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_status_summary_view(request):
    """View for project status summary"""
    user = request.user
    
    # Get projects based on user role
    if user.is_admin or user.is_auditor:
        projects = Project.objects.all()
    elif user.is_department_head and user.department:
        projects = Project.objects.filter(department=user.department)
    else:
        projects = Project.objects.filter(manager=user)
    
    # Calculate status counts
    status_counts = {
        'planning': projects.filter(status='planning').count(),
        'active': projects.filter(status='active').count(),
        'completed': projects.filter(status='completed').count(),
        'cancelled': projects.filter(status='cancelled').count(),
    }
    
    # Calculate budget utilization
    total_budget = projects.aggregate(total=Sum('budget'))['total'] or 0
    total_spent = projects.aggregate(total=Sum('spent'))['total'] or 0
    utilization_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0
    
    summary = {
        'status_counts': status_counts,
        'total_budget': float(total_budget),
        'total_spent': float(total_spent),
        'utilization_percentage': round(utilization_percentage, 2),
        'total_projects': projects.count(),
    }
    
    return Response(summary, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_performance_view(request):
    """View for department performance data"""
    departments = Department.objects.all()
    
    performance_data = []
    for dept in departments:
        projects = dept.projects.all()
        total_budget = projects.aggregate(total=Sum('budget'))['total'] or 0
        total_spent = projects.aggregate(total=Sum('spent'))['total'] or 0
        utilization_percentage = (total_spent / total_budget * 100) if total_budget > 0 else 0
        
        performance_data.append({
            'department_id': dept.id,
            'department_name': dept.name,
            'budget': float(dept.budget),
            'spent': float(total_spent),
            'utilization_percentage': round(utilization_percentage, 2),
            'projects_count': projects.count(),
            'active_projects_count': projects.filter(status='active').count(),
            'completed_projects_count': projects.filter(status='completed').count(),
        })
    
    return Response(performance_data, status=status.HTTP_200_OK)


# Community Feedback Views
class CommunityFeedbackListView(generics.ListCreateAPIView):
    """View for listing and creating community feedback"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['feedback_type', 'priority', 'status', 'project', 'department']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return CommunityFeedback.objects.all()
        else:
            # Regular users can only see public feedback
            return CommunityFeedback.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CommunityFeedbackSerializer
        return CommunityFeedbackCreateSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CommunityFeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for community feedback details"""
    queryset = CommunityFeedback.objects.all()
    serializer_class = CommunityFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Handle AnonymousUser for Swagger schema generation
        if not user.is_authenticated:
            return CommunityFeedback.objects.none()
        
        if user.is_admin or user.is_auditor:
            return CommunityFeedback.objects.all()
        else:
            # Users can only see their own feedback or public feedback
            return CommunityFeedback.objects.filter(
                Q(user=user) | Q(is_public=True)
            )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def respond_to_feedback_view(request, feedback_id):
    """View for responding to community feedback"""
    try:
        feedback = CommunityFeedback.objects.get(id=feedback_id)
        
        # Only admins, auditors, and department heads can respond
        if not (request.user.is_admin or request.user.is_auditor or request.user.is_department_head):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        response_text = request.data.get('response')
        if not response_text:
            return Response({'error': 'Response text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        feedback.response = response_text
        feedback.responded_by = request.user
        feedback.responded_at = timezone.now()
        feedback.status = 'responded'
        feedback.save()
        
        return Response({'message': 'Response added successfully'}, status=status.HTTP_200_OK)
    except CommunityFeedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_feedback_status_view(request, feedback_id):
    """View for updating feedback status"""
    try:
        feedback = CommunityFeedback.objects.get(id=feedback_id)
        
        # Only admins and auditors can update status
        if not (request.user.is_admin or request.user.is_auditor):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in ['pending', 'under_review', 'responded', 'resolved', 'closed']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        feedback.status = new_status
        feedback.save()
        
        return Response({'message': 'Status updated successfully'}, status=status.HTTP_200_OK)
    except CommunityFeedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=status.HTTP_404_NOT_FOUND)


# Budget Version Views
class BudgetVersionListView(generics.ListCreateAPIView):
    """View for listing and creating budget versions"""
    queryset = BudgetVersion.objects.all()
    serializer_class = BudgetVersionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project']
    ordering = ['-version_number']


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_budget_version_view(request, project_id):
    """View for creating a new budget version"""
    try:
        project = Project.objects.get(id=project_id)
        
        # Only project managers, department heads, and admins can create versions
        if not (request.user.is_admin or request.user.is_department_head or project.manager == request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_budget = request.data.get('budget_amount')
        change_reason = request.data.get('change_reason')
        
        if not new_budget or not change_reason:
            return Response({'error': 'Budget amount and change reason are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get the latest version number
        latest_version = BudgetVersion.objects.filter(project=project).order_by('-version_number').first()
        version_number = (latest_version.version_number + 1) if latest_version else 1
        
        # Create new version
        version = BudgetVersion.objects.create(
            project=project,
            version_number=version_number,
            budget_amount=new_budget,
            change_reason=change_reason,
            changed_by=request.user,
            previous_version=latest_version
        )
        
        # Update project budget
        project.budget = new_budget
        project.save()
        
        serializer = BudgetVersionSerializer(version)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)


# Audit Log Views
class AuditLogListView(generics.ListAPIView):
    """View for listing audit logs"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['user', 'action', 'model_name']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        # Only admins and auditors can see audit logs
        if not (self.request.user.is_admin or self.request.user.is_auditor):
            return AuditLog.objects.none()
        return AuditLog.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def enhanced_dashboard_metrics_view(request):
    """Enhanced view for dashboard metrics with all required data"""
    # Calculate total budget
    total_budget = Department.objects.aggregate(
        total=Sum('budget')
    )['total'] or 0
    
    # Calculate utilized funds
    utilized_funds = Project.objects.aggregate(
        total=Sum('spent')
    )['total'] or 0
    
    # Count active projects
    active_projects = Project.objects.filter(status='active').count()
    
    # Count anomalies (from fund_flows app)
    from fund_flows.models import Anomaly
    anomalies_count = Anomaly.objects.filter(resolved=False).count()
    
    # Count departments
    departments_count = Department.objects.count()
    
    # Calculate average trust score
    from fund_flows.models import TrustIndicator
    trust_indicators = TrustIndicator.objects.all()
    if trust_indicators.exists():
        trust_scores = [indicator.overall_score for indicator in trust_indicators]
        trust_score = int(sum(trust_scores) / len(trust_scores))
    else:
        trust_score = 0
    
    # Count community feedback
    community_feedback_count = CommunityFeedback.objects.filter(status='pending').count()
    
    # Count pending verifications
    pending_verifications = ImpactMetric.objects.filter(verified=False).count()
    
    metrics = {
        'totalBudget': float(total_budget),
        'utilizedFunds': float(utilized_funds),
        'activeProjects': active_projects,
        'anomaliesCount': anomalies_count,
        'departmentsCount': departments_count,
        'trustScore': trust_score,
        'communityFeedbackCount': community_feedback_count,
        'pendingVerifications': pending_verifications,
    }
    
    return Response(metrics, status=status.HTTP_200_OK)


class FundAllocationListView(generics.ListCreateAPIView):
    """List and create fund allocations"""
    serializer_class = FundAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project_id')
        
        queryset = FundAllocation.objects.select_related('project', 'allocated_by', 'approved_by')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter based on user role
        if user.is_admin or user.is_auditor:
            return queryset
        elif user.is_department_head and user.department:
            return queryset.filter(project__department=user.department)
        else:
            # For regular users, show allocations for their department projects
            if user.department:
                return queryset.filter(project__department=user.department)
            return queryset.none()
    
    def perform_create(self, serializer):
        serializer.save(allocated_by=self.request.user)


class FundAllocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a fund allocation"""
    serializer_class = FundAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return FundAllocation.objects.select_related('project', 'allocated_by', 'approved_by')
        elif user.is_department_head and user.department:
            return FundAllocation.objects.filter(project__department=user.department).select_related('project', 'allocated_by', 'approved_by')
        else:
            if user.department:
                return FundAllocation.objects.filter(project__department=user.department).select_related('project', 'allocated_by', 'approved_by')
            return FundAllocation.objects.none()


class ProjectSpendingListView(generics.ListCreateAPIView):
    """List and create project spending records"""
    serializer_class = ProjectSpendingSerializer
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectSpendingCreateSerializer
        return ProjectSpendingSerializer
    
    def get_queryset(self):
        user = self.request.user
        project_id = self.request.query_params.get('project')
        
        queryset = ProjectSpending.objects.select_related('project', 'created_by', 'approved_by')
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        if user.is_admin or user.is_auditor:
            return queryset
        elif user.is_department_head and user.department:
            return queryset.filter(project__department=user.department)
        else:
            if user.department:
                return queryset.filter(project__department=user.department)
            return queryset.filter(created_by=user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectSpendingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project spending record"""
    serializer_class = ProjectSpendingSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin or user.is_auditor:
            return ProjectSpending.objects.select_related('project', 'created_by', 'approved_by')
        elif user.is_department_head and user.department:
            return ProjectSpending.objects.filter(project__department=user.department).select_related('project', 'created_by', 'approved_by')
        else:
            if user.department:
                return ProjectSpending.objects.filter(project__department=user.department).select_related('project', 'created_by', 'approved_by')
            return ProjectSpending.objects.filter(created_by=user).select_related('project', 'created_by', 'approved_by')
    
    def perform_update(self, serializer):
        # Only allow status updates for approvers
        if 'status' in serializer.validated_data:
            if self.request.user.is_admin or self.request.user.is_auditor or self.request.user.is_department_head:
                if serializer.validated_data['status'] == 'approved':
                    serializer.save(approved_by=self.request.user, approved_at=timezone.now())
                else:
                    serializer.save()
            else:
                # Regular users can only update their own records and only certain fields
                if serializer.instance.created_by == self.request.user:
                    allowed_fields = ['description', 'supporting_documents']
                    for field in allowed_fields:
                        if field in serializer.validated_data:
                            setattr(serializer.instance, field, serializer.validated_data[field])
                    serializer.instance.save()
                else:
                    raise PermissionDenied("You can only update your own spending records")
        else:
            serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def run_anomaly_detection_view(request):
    """Run anomaly detection on all fund flows and projects"""
    try:
        # Run all anomaly detection methods
        results = {
            'budget_overruns': AnomalyDetectionService.detect_budget_overruns(),
            'unusual_transactions': AnomalyDetectionService.detect_unusual_transactions(),
            'timeline_anomalies': AnomalyDetectionService.detect_timeline_anomalies(),
            'pattern_anomalies': AnomalyDetectionService.detect_pattern_anomalies(),
        }
        
        # Count total anomalies detected
        total_anomalies = sum(len(anomalies) for anomalies in results.values())
        
        return Response({
            'message': 'Anomaly detection completed successfully',
            'total_anomalies_detected': total_anomalies,
            'results': results
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Anomaly detection failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)