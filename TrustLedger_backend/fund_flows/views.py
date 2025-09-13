from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.utils import timezone
from .models import FundSource, FundFlow, Anomaly, TrustIndicator
from .serializers import (
    FundSourceSerializer, FundFlowSerializer, FundFlowListSerializer,
    AnomalySerializer, AnomalyCreateSerializer, AnomalyResolveSerializer,
    TrustIndicatorSerializer, TrustIndicatorCreateSerializer,
    FundFlowDiagramSerializer
)


class FundSourceListView(generics.ListCreateAPIView):
    """View for listing and creating fund sources"""
    queryset = FundSource.objects.all()
    serializer_class = FundSourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'total_amount', 'created_at']
    ordering = ['name']


class FundSourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for fund source details"""
    queryset = FundSource.objects.all()
    serializer_class = FundSourceSerializer
    permission_classes = [permissions.IsAuthenticated]


class FundFlowListView(generics.ListCreateAPIView):
    """View for listing and creating fund flows"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['source', 'target_department', 'target_project', 'status']
    search_fields = ['description']
    ordering_fields = ['amount', 'transaction_date', 'created_at']
    ordering = ['-transaction_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return FundFlow.objects.all()
        elif user.is_department_head and user.department:
            return FundFlow.objects.filter(
                Q(target_department=user.department) | 
                Q(target_project__department=user.department)
            )
        else:
            return FundFlow.objects.filter(
                Q(target_project__manager=user) |
                Q(target_department__head=user)
            )
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FundFlowListSerializer
        return FundFlowSerializer


class FundFlowDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for fund flow details"""
    queryset = FundFlow.objects.all()
    serializer_class = FundFlowSerializer
    permission_classes = [permissions.IsAuthenticated]


class AnomalyListView(generics.ListCreateAPIView):
    """View for listing and creating anomalies"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['severity', 'resolved', 'detected_by']
    search_fields = ['description', 'resolution_notes']
    ordering_fields = ['severity', 'detected_at', 'resolved_at']
    ordering = ['-detected_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_auditor:
            return Anomaly.objects.all()
        else:
            return Anomaly.objects.filter(
                Q(fund_flow__target_department__head=user) |
                Q(fund_flow__target_project__manager=user)
            )
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AnomalySerializer
        return AnomalyCreateSerializer


class AnomalyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for anomaly details"""
    queryset = Anomaly.objects.all()
    serializer_class = AnomalySerializer
    permission_classes = [permissions.IsAuthenticated]


class AnomalyResolveView(generics.UpdateAPIView):
    """View for resolving anomalies"""
    queryset = Anomaly.objects.all()
    serializer_class = AnomalyResolveSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_auditor:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


class TrustIndicatorListView(generics.ListCreateAPIView):
    """View for listing and creating trust indicators"""
    queryset = TrustIndicator.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['department']
    ordering_fields = ['overall_score', 'calculated_at']
    ordering = ['-calculated_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TrustIndicatorSerializer
        return TrustIndicatorCreateSerializer


class TrustIndicatorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for trust indicator details"""
    queryset = TrustIndicator.objects.all()
    serializer_class = TrustIndicatorSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def fund_flow_diagram_view(request):
    """View for fund flow diagram data"""
    # Get all fund flows
    fund_flows = FundFlow.objects.all()
    
    # Create nodes for sources
    sources = FundSource.objects.all()
    source_nodes = []
    for source in sources:
        source_nodes.append({
            'id': f"source_{source.id}",
            'name': source.name,
            'amount': float(source.total_amount),
            'type': 'source',
            'status': 'verified',
            'position': {'x': 100, 'y': 200}
        })
    
    # Create nodes for departments
    departments = []
    for flow in fund_flows:
        if flow.target_department and flow.target_department not in departments:
            departments.append(flow.target_department)
    
    department_nodes = []
    for i, dept in enumerate(departments):
        department_nodes.append({
            'id': f"dept_{dept.id}",
            'name': dept.name,
            'amount': float(dept.budget),
            'type': 'department',
            'status': 'verified',
            'position': {'x': 400, 'y': 100 + (i * 150)}
        })
    
    # Create nodes for projects
    projects = []
    for flow in fund_flows:
        if flow.target_project and flow.target_project not in projects:
            projects.append(flow.target_project)
    
    project_nodes = []
    for i, project in enumerate(projects):
        project_nodes.append({
            'id': f"project_{project.id}",
            'name': project.name,
            'amount': float(project.budget),
            'type': 'project',
            'status': 'verified',
            'position': {'x': 700, 'y': 100 + (i * 100)}
        })
    
    # Create links
    links = []
    for flow in fund_flows:
        source_id = f"source_{flow.source.id}"
        
        if flow.target_department:
            target_id = f"dept_{flow.target_department.id}"
        else:
            target_id = f"project_{flow.target_project.id}"
        
        links.append({
            'source': source_id,
            'target': target_id,
            'amount': float(flow.amount),
            'status': flow.status
        })
    
    diagram_data = {
        'nodes': source_nodes + department_nodes + project_nodes,
        'links': links
    }
    
    serializer = FundFlowDiagramSerializer(diagram_data)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def anomalies_count_view(request):
    """View for getting anomalies count"""
    user = request.user
    
    if user.is_admin or user.is_auditor:
        total_anomalies = Anomaly.objects.count()
        unresolved_anomalies = Anomaly.objects.filter(resolved=False).count()
    else:
        total_anomalies = Anomaly.objects.filter(
            Q(fund_flow__target_department__head=user) |
            Q(fund_flow__target_project__manager=user)
        ).count()
        unresolved_anomalies = Anomaly.objects.filter(
            Q(fund_flow__target_department__head=user) |
            Q(fund_flow__target_project__manager=user),
            resolved=False
        ).count()
    
    return Response({
        'total_anomalies': total_anomalies,
        'unresolved_anomalies': unresolved_anomalies
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def trust_indicators_summary_view(request):
    """View for trust indicators summary"""
    # Get latest trust indicators for each department
    departments = []
    for dept in Department.objects.all():
        latest_indicator = TrustIndicator.objects.filter(
            department=dept
        ).order_by('-calculated_at').first()
        
        if latest_indicator:
            departments.append({
                'department_id': dept.id,
                'department_name': dept.name,
                'transparency_score': latest_indicator.transparency_score,
                'community_oversight_score': latest_indicator.community_oversight_score,
                'response_time_score': latest_indicator.response_time_score,
                'document_completeness_score': latest_indicator.document_completeness_score,
                'overall_score': latest_indicator.overall_score,
                'calculated_at': latest_indicator.calculated_at
            })
    
    # Sort by overall score
    departments.sort(key=lambda x: x['overall_score'], reverse=True)
    
    return Response(departments, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_fund_flow_view(request, flow_id):
    """View for verifying fund flows"""
    if not request.user.is_auditor:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        fund_flow = FundFlow.objects.get(id=flow_id)
        fund_flow.status = 'verified'
        fund_flow.verified_by = request.user
        fund_flow.verified_at = timezone.now()
        fund_flow.save()
        
        return Response({'message': 'Fund flow verified successfully'}, status=status.HTTP_200_OK)
    except FundFlow.DoesNotExist:
        return Response({'error': 'Fund flow not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def flag_anomaly_view(request, flow_id):
    """View for flagging fund flows as anomalies"""
    try:
        fund_flow = FundFlow.objects.get(id=flow_id)
        
        # Create anomaly
        anomaly = Anomaly.objects.create(
            fund_flow=fund_flow,
            description=request.data.get('description', 'Anomaly detected'),
            severity=request.data.get('severity', 'medium'),
            detected_by=request.user
        )
        
        # Update fund flow status
        fund_flow.status = 'anomaly'
        fund_flow.save()
        
        return Response({
            'message': 'Anomaly flagged successfully',
            'anomaly_id': anomaly.id
        }, status=status.HTTP_201_CREATED)
    except FundFlow.DoesNotExist:
        return Response({'error': 'Fund flow not found'}, status=status.HTTP_404_NOT_FOUND)