#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TrustLedger_backend.settings')
django.setup()

from core.models import Department, Project, ImpactMetric, CommunityFeedback
from fund_flows.models import FundSource, FundFlow, Anomaly, TrustIndicator
from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_data():
    print("Creating sample data...")
    
    # Create a test user if it doesn't exist
    user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@trustledger.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        user.set_password('admin123')
        user.save()
        print("Created admin user")
    
    # Create departments
    dept1, created = Department.objects.get_or_create(
        name='Education Department',
        defaults={'budget': 1000000, 'spent': 750000}
    )
    if created:
        print("Created Education Department")
    
    dept2, created = Department.objects.get_or_create(
        name='Healthcare Department',
        defaults={'budget': 800000, 'spent': 600000}
    )
    if created:
        print("Created Healthcare Department")
    
    dept3, created = Department.objects.get_or_create(
        name='Infrastructure Department',
        defaults={'budget': 1200000, 'spent': 900000}
    )
    if created:
        print("Created Infrastructure Department")
    
    # Create projects
    project1, created = Project.objects.get_or_create(
        name='School Building Project',
        defaults={
            'description': 'Construction of new school building',
            'budget': 500000,
            'spent': 375000,
            'status': 'active',
            'start_date': '2024-01-01',
            'department': dept1
        }
    )
    if created:
        print("Created School Building Project")
    
    project2, created = Project.objects.get_or_create(
        name='Hospital Equipment',
        defaults={
            'description': 'Purchase of medical equipment',
            'budget': 300000,
            'spent': 250000,
            'status': 'active',
            'start_date': '2024-02-01',
            'department': dept2
        }
    )
    if created:
        print("Created Hospital Equipment Project")
    
    project3, created = Project.objects.get_or_create(
        name='Road Construction',
        defaults={
            'description': 'Construction of new roads',
            'budget': 800000,
            'spent': 600000,
            'status': 'completed',
            'start_date': '2023-12-01',
            'department': dept3
        }
    )
    if created:
        print("Created Road Construction Project")
    
    # Create impact metrics
    ImpactMetric.objects.get_or_create(
        project=project1,
        metric_type='beneficiaries',
        defaults={
            'value': 500,
            'unit': 'students',
            'date': '2024-03-01',
            'verified': True
        }
    )
    
    ImpactMetric.objects.get_or_create(
        project=project2,
        metric_type='efficiency',
        defaults={
            'value': 85,
            'unit': 'percentage',
            'date': '2024-03-01',
            'verified': True
        }
    )
    
    # Create fund sources
    source1, created = FundSource.objects.get_or_create(
        name='Government Grant',
        defaults={'description': 'Government funding for public projects', 'total_amount': 2000000}
    )
    if created:
        print("Created Government Grant source")
    
    # Create fund flows
    FundFlow.objects.get_or_create(
        source=source1,
        target_department=dept1,
        amount=500000,
        description='School construction funding',
        status='verified',
        transaction_date='2024-01-01',
        verified_by=user
    )
    
    FundFlow.objects.get_or_create(
        source=source1,
        target_department=dept2,
        amount=300000,
        description='Medical equipment funding',
        status='verified',
        transaction_date='2024-02-01',
        verified_by=user
    )
    
    # Create trust indicators
    TrustIndicator.objects.get_or_create(
        department=dept1,
        defaults={
            'transparency_score': 85,
            'community_oversight_score': 78,
            'response_time_score': 90,
            'document_completeness_score': 82,
            'overall_score': 84
        }
    )
    
    TrustIndicator.objects.get_or_create(
        department=dept2,
        defaults={
            'transparency_score': 88,
            'community_oversight_score': 85,
            'response_time_score': 87,
            'document_completeness_score': 90,
            'overall_score': 88
        }
    )
    
    # Create community feedback
    CommunityFeedback.objects.get_or_create(
        user=user,
        project=project1,
        feedback_type='suggestion',
        defaults={
            'title': 'Need more transparency',
            'description': 'Would like to see more detailed progress reports',
            'priority': 'medium',
            'is_public': True,
            'is_anonymous': False,
            'status': 'pending'
        }
    )
    
    print("Sample data creation completed!")

if __name__ == '__main__':
    create_sample_data()
