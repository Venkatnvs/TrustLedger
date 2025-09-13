from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.utils import timezone
from .models import Department, Project, ImpactMetric
from .serializers import (
    DepartmentSerializer, DepartmentListSerializer, ProjectSerializer,
    ProjectListSerializer, ProjectCreateSerializer, ProjectUpdateSerializer,
    ImpactMetricSerializer
)


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
            return Project.objects.filter(manager=user)
    
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