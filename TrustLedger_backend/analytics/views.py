from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import (
    DashboardMetrics, SearchFilter, AuditLog, Report, 
    Notification, SystemConfiguration
)
from .serializers import (
    DashboardMetricsSerializer, SearchFilterSerializer, SearchFilterCreateSerializer,
    AuditLogSerializer, ReportSerializer, ReportCreateSerializer,
    NotificationSerializer, NotificationCreateSerializer,
    SystemConfigurationSerializer, SystemConfigurationUpdateSerializer,
    AnalyticsDataSerializer, DepartmentPerformanceSerializer, ProjectStatusSerializer
)
from core.models import Department, Project
from fund_flows.models import Anomaly, TrustIndicator
from documents.models import Document
from accounts.models import User


class SearchFilterListView(generics.ListCreateAPIView):
    """View for listing and creating search filters"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_public']
    search_fields = ['name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return SearchFilter.objects.all()
        else:
            return SearchFilter.objects.filter(
                Q(created_by=user) | Q(is_public=True)
            )
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SearchFilterSerializer
        return SearchFilterCreateSerializer


class SearchFilterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for search filter details"""
    queryset = SearchFilter.objects.all()
    serializer_class = SearchFilterSerializer
    permission_classes = [permissions.IsAuthenticated]


class AuditLogListView(generics.ListAPIView):
    """View for listing audit logs"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['user', 'action', 'model_name']
    search_fields = ['object_repr']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        if not (user.is_admin or user.is_auditor):
            return AuditLog.objects.filter(user=user)
        return AuditLog.objects.all()


class ReportListView(generics.ListCreateAPIView):
    """View for listing and creating reports"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['report_type', 'is_public']
    search_fields = ['name']
    ordering_fields = ['generated_at']
    ordering = ['-generated_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return Report.objects.all()
        else:
            return Report.objects.filter(
                Q(generated_by=user) | Q(is_public=True)
            )
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ReportSerializer
        return ReportCreateSerializer


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for report details"""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]


class NotificationListView(generics.ListCreateAPIView):
    """View for listing and creating notifications"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['notification_type', 'is_read']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return NotificationSerializer
        return NotificationCreateSerializer


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for notification details"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class SystemConfigurationListView(generics.ListCreateAPIView):
    """View for listing and creating system configurations"""
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['key', 'description']
    ordering = ['key']
    
    def get_queryset(self):
        if not self.request.user.is_admin:
            return SystemConfiguration.objects.none()
        return SystemConfiguration.objects.all()


class SystemConfigurationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for system configuration details"""
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SystemConfigurationUpdateSerializer
        return SystemConfigurationSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_dashboard_view(request):
    """View for analytics dashboard data"""
    # Calculate metrics
    total_budget = Department.objects.aggregate(total=Sum('budget'))['total'] or 0
    utilized_funds = Project.objects.aggregate(total=Sum('spent'))['total'] or 0
    active_projects = Project.objects.filter(status='active').count()
    anomalies_count = Anomaly.objects.filter(resolved=False).count()
    departments_count = Department.objects.count()
    users_count = User.objects.count()
    documents_count = Document.objects.count()
    
    analytics_data = {
        'total_budget': float(total_budget),
        'utilized_funds': float(utilized_funds),
        'active_projects': active_projects,
        'anomalies_count': anomalies_count,
        'departments_count': departments_count,
        'users_count': users_count,
        'documents_count': documents_count,
    }
    
    serializer = AnalyticsDataSerializer(analytics_data)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_read_view(request, notification_id):
    """View for marking notifications as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.mark_as_read()
        return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_all_read_view(request):
    """View for marking all notifications as read"""
    Notification.objects.filter(user=request.user, is_read=False).update(
        is_read=True,
        read_at=timezone.now()
    )
    return Response({'message': 'All notifications marked as read'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notifications_count_view(request):
    """View for getting unread notifications count"""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'unread_count': count}, status=status.HTTP_200_OK)