"""
Services for anomaly detection and other business logic
"""
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from .models import Project, Department, CommunityFeedback
from fund_flows.models import FundFlow, Anomaly, TrustIndicator


class AnomalyDetectionService:
    """Service for detecting anomalies in fund flows and budgets"""
    
    @staticmethod
    def detect_budget_overruns():
        """Detect projects with budget overruns"""
        anomalies = []
        
        # Find projects where spent > budget
        overrun_projects = Project.objects.filter(
            spent__gt=models.F('budget')
        )
        
        for project in overrun_projects:
            overrun_amount = project.spent - project.budget
            overrun_percentage = (overrun_amount / project.budget) * 100
            
            severity = 'low'
            if overrun_percentage > 50:
                severity = 'critical'
            elif overrun_percentage > 25:
                severity = 'high'
            elif overrun_percentage > 10:
                severity = 'medium'
            
            # Check if anomaly already exists
            existing_anomaly = Anomaly.objects.filter(
                fund_flow__target_project=project,
                description__icontains='Budget overrun',
                resolved=False
            ).first()
            
            if not existing_anomaly:
                # Create fund flow for the overrun
                fund_flow = FundFlow.objects.create(
                    source_id=1,  # Default source
                    target_project=project,
                    amount=overrun_amount,
                    status='anomaly',
                    description=f'Budget overrun detected: {overrun_percentage:.1f}% over budget',
                    transaction_date=timezone.now().date()
                )
                
                # Create anomaly
                Anomaly.objects.create(
                    fund_flow=fund_flow,
                    description=f'Project "{project.name}" has exceeded budget by ₹{overrun_amount:,.2f} ({overrun_percentage:.1f}%)',
                    severity=severity,
                    detected_by_id=1  # System user
                )
                
                anomalies.append({
                    'project': project.name,
                    'overrun_amount': float(overrun_amount),
                    'overrun_percentage': float(overrun_percentage),
                    'severity': severity
                })
        
        return anomalies
    
    @staticmethod
    def detect_unusual_spending_patterns():
        """Detect unusual spending patterns"""
        anomalies = []
        
        # Find projects with sudden spending spikes
        projects = Project.objects.filter(status='active')
        
        for project in projects:
            # Get recent fund flows for this project
            recent_flows = FundFlow.objects.filter(
                target_project=project,
                transaction_date__gte=timezone.now().date() - timedelta(days=30)
            ).order_by('transaction_date')
            
            if recent_flows.count() < 2:
                continue
            
            # Calculate average daily spending
            total_recent = sum(flow.amount for flow in recent_flows)
            avg_daily = total_recent / 30
            
            # Check for spikes (3x average)
            for flow in recent_flows:
                if flow.amount > avg_daily * 3:
                    # Check if anomaly already exists
                    existing_anomaly = Anomaly.objects.filter(
                        fund_flow=flow,
                        description__icontains='Unusual spending spike',
                        resolved=False
                    ).first()
                    
                    if not existing_anomaly:
                        Anomaly.objects.create(
                            fund_flow=flow,
                            description=f'Unusual spending spike detected: ₹{flow.amount:,.2f} on {flow.transaction_date} (3x daily average)',
                            severity='medium',
                            detected_by_id=1  # System user
                        )
                        
                        anomalies.append({
                            'project': project.name,
                            'amount': float(flow.amount),
                            'date': flow.transaction_date,
                            'average_daily': float(avg_daily)
                        })
        
        return anomalies
    
    @staticmethod
    def detect_delayed_projects():
        """Detect projects that are significantly delayed"""
        anomalies = []
        
        # Find projects that should have been completed but aren't
        overdue_projects = Project.objects.filter(
            status__in=['planning', 'active'],
            end_date__lt=timezone.now().date()
        )
        
        for project in overdue_projects:
            days_overdue = (timezone.now().date() - project.end_date).days
            
            severity = 'low'
            if days_overdue > 90:
                severity = 'critical'
            elif days_overdue > 60:
                severity = 'high'
            elif days_overdue > 30:
                severity = 'medium'
            
            # Check if anomaly already exists
            existing_anomaly = Anomaly.objects.filter(
                fund_flow__target_project=project,
                description__icontains='Project delay',
                resolved=False
            ).first()
            
            if not existing_anomaly:
                # Create fund flow for the delay
                fund_flow = FundFlow.objects.create(
                    source_id=1,  # Default source
                    target_project=project,
                    amount=0,  # No financial impact, just tracking
                    status='anomaly',
                    description=f'Project delay detected: {days_overdue} days overdue',
                    transaction_date=timezone.now().date()
                )
                
                # Create anomaly
                Anomaly.objects.create(
                    fund_flow=fund_flow,
                    description=f'Project "{project.name}" is {days_overdue} days overdue (end date: {project.end_date})',
                    severity=severity,
                    detected_by_id=1  # System user
                )
                
                anomalies.append({
                    'project': project.name,
                    'days_overdue': days_overdue,
                    'end_date': project.end_date,
                    'severity': severity
                })
        
        return anomalies
    
    @staticmethod
    def run_all_detections():
        """Run all anomaly detection methods"""
        results = {
            'budget_overruns': AnomalyDetectionService.detect_budget_overruns(),
            'unusual_spending': AnomalyDetectionService.detect_unusual_spending_patterns(),
            'delayed_projects': AnomalyDetectionService.detect_delayed_projects(),
        }
        
        total_anomalies = sum(len(anomalies) for anomalies in results.values())
        results['total_detected'] = total_anomalies
        
        return results


class TrustScoreCalculator:
    """Service for calculating trust scores"""
    
    @staticmethod
    def calculate_department_trust_score(department):
        """Calculate trust score for a department"""
        # Transparency score (based on document completeness and verification)
        transparency_score = TrustScoreCalculator._calculate_transparency_score(department)
        
        # Community oversight score (based on feedback and responses)
        community_score = TrustScoreCalculator._calculate_community_score(department)
        
        # Response time score (based on how quickly they respond to feedback)
        response_score = TrustScoreCalculator._calculate_response_score(department)
        
        # Document completeness score
        document_score = TrustScoreCalculator._calculate_document_score(department)
        
        # Create or update trust indicator
        trust_indicator, created = TrustIndicator.objects.get_or_create(
            department=department,
            defaults={
                'transparency_score': transparency_score,
                'community_oversight_score': community_score,
                'response_time_score': response_score,
                'document_completeness_score': document_score,
            }
        )
        
        if not created:
            trust_indicator.transparency_score = transparency_score
            trust_indicator.community_oversight_score = community_score
            trust_indicator.response_time_score = response_score
            trust_indicator.document_completeness_score = document_score
            trust_indicator.save()
        
        return trust_indicator
    
    @staticmethod
    def _calculate_transparency_score(department):
        """Calculate transparency score based on project visibility"""
        projects = department.projects.all()
        if not projects.exists():
            return 50  # Neutral score for departments with no projects
        
        # Score based on project status distribution
        total_projects = projects.count()
        completed_projects = projects.filter(status='completed').count()
        active_projects = projects.filter(status='active').count()
        
        # Higher score for more completed projects
        completion_ratio = completed_projects / total_projects
        return min(int(completion_ratio * 100), 100)
    
    @staticmethod
    def _calculate_community_score(department):
        """Calculate community oversight score"""
        # Count public feedback for this department
        feedback_count = CommunityFeedback.objects.filter(
            department=department,
            is_public=True
        ).count()
        
        # Count responses to feedback
        responded_count = CommunityFeedback.objects.filter(
            department=department,
            status__in=['responded', 'resolved']
        ).count()
        
        if feedback_count == 0:
            return 50  # Neutral score if no feedback
        
        response_ratio = responded_count / feedback_count
        return min(int(response_ratio * 100), 100)
    
    @staticmethod
    def _calculate_response_score(department):
        """Calculate response time score"""
        feedback_with_responses = CommunityFeedback.objects.filter(
            department=department,
            responded_at__isnull=False
        )
        
        if not feedback_with_responses.exists():
            return 50  # Neutral score if no responses
        
        # Calculate average response time
        total_response_time = 0
        for feedback in feedback_with_responses:
            response_time = feedback.responded_at - feedback.created_at
            total_response_time += response_time.total_seconds()
        
        avg_response_hours = total_response_time / (feedback_with_responses.count() * 3600)
        
        # Score based on response time (lower is better)
        if avg_response_hours < 24:
            return 100
        elif avg_response_hours < 72:
            return 80
        elif avg_response_hours < 168:  # 1 week
            return 60
        else:
            return 40
    
    @staticmethod
    def _calculate_document_score(department):
        """Calculate document completeness score"""
        projects = department.projects.all()
        if not projects.exists():
            return 50
        
        total_documents = 0
        verified_documents = 0
        
        for project in projects:
            project_docs = project.documents.all()
            total_documents += project_docs.count()
            verified_documents += project_docs.filter(verified=True).count()
        
        if total_documents == 0:
            return 30  # Low score if no documents
        
        verification_ratio = verified_documents / total_documents
        return min(int(verification_ratio * 100), 100)


class SearchService:
    """Service for advanced search functionality"""
    
    @staticmethod
    def search_transactions(query, filters=None):
        """Search transactions with advanced filters"""
        queryset = FundFlow.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(description__icontains=query) |
                Q(source__name__icontains=query) |
                Q(target_department__name__icontains=query) |
                Q(target_project__name__icontains=query)
            )
        
        if filters:
            if filters.get('department_id'):
                queryset = queryset.filter(target_department_id=filters['department_id'])
            
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            
            if filters.get('min_amount'):
                queryset = queryset.filter(amount__gte=filters['min_amount'])
            
            if filters.get('max_amount'):
                queryset = queryset.filter(amount__lte=filters['max_amount'])
            
            if filters.get('year'):
                queryset = queryset.filter(transaction_date__year=filters['year'])
            
            if filters.get('verification_status'):
                if filters['verification_status'] == 'verified':
                    queryset = queryset.filter(verified_by__isnull=False)
                elif filters['verification_status'] == 'unverified':
                    queryset = queryset.filter(verified_by__isnull=True)
        
        return queryset.order_by('-transaction_date')
    
    @staticmethod
    def search_projects(query, filters=None):
        """Search projects with advanced filters"""
        queryset = Project.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(department__name__icontains=query)
            )
        
        if filters:
            if filters.get('department_id'):
                queryset = queryset.filter(department_id=filters['department_id'])
            
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            
            if filters.get('min_budget'):
                queryset = queryset.filter(budget__gte=filters['min_budget'])
            
            if filters.get('max_budget'):
                queryset = queryset.filter(budget__lte=filters['max_budget'])
        
        return queryset.order_by('-created_at')
