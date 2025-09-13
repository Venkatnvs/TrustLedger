#!/usr/bin/env python
"""
Script to populate initial data for TrustLedger
Run with: python manage.py shell < populate_initial_data.py
"""

from django.contrib.auth import get_user_model
from core.models import Department, Project, ImpactMetric, CommunityFeedback
from fund_flows.models import FundSource, FundFlow, TrustIndicator
from datetime import date, timedelta
from decimal import Decimal

User = get_user_model()

def create_initial_data():
    print("Creating initial data for TrustLedger...")
    
    # Create departments
    departments_data = [
        {
            'name': 'Education Department',
            'description': 'Responsible for educational initiatives and school programs',
            'budget': Decimal('50000000.00'),
        },
        {
            'name': 'Healthcare Department', 
            'description': 'Manages healthcare facilities and medical programs',
            'budget': Decimal('75000000.00'),
        },
        {
            'name': 'Infrastructure Department',
            'description': 'Handles road construction and public infrastructure',
            'budget': Decimal('100000000.00'),
        },
        {
            'name': 'Social Welfare Department',
            'description': 'Manages social programs and welfare schemes',
            'budget': Decimal('30000000.00'),
        }
    ]
    
    departments = []
    for dept_data in departments_data:
        dept, created = Department.objects.get_or_create(
            name=dept_data['name'],
            defaults=dept_data
        )
        departments.append(dept)
        print(f"{'Created' if created else 'Found'} department: {dept.name}")
    
    # Create fund sources
    fund_sources_data = [
        {
            'name': 'Central Government Grant',
            'description': 'Annual allocation from central government',
            'total_amount': Decimal('200000000.00'),
        },
        {
            'name': 'State Budget',
            'description': 'State government budget allocation',
            'total_amount': Decimal('150000000.00'),
        },
        {
            'name': 'External Donations',
            'description': 'Donations from NGOs and private organizations',
            'total_amount': Decimal('50000000.00'),
        }
    ]
    
    fund_sources = []
    for source_data in fund_sources_data:
        source, created = FundSource.objects.get_or_create(
            name=source_data['name'],
            defaults=source_data
        )
        fund_sources.append(source)
        print(f"{'Created' if created else 'Found'} fund source: {source.name}")
    
    # Create sample projects
    projects_data = [
        {
            'name': 'Digital Learning Initiative',
            'description': 'Providing tablets and digital content to rural schools',
            'budget': Decimal('15000000.00'),
            'spent': Decimal('8000000.00'),
            'status': 'active',
            'priority': 'high',
            'start_date': date.today() - timedelta(days=90),
            'end_date': date.today() + timedelta(days=180),
            'expected_beneficiaries': 5000,
            'location': 'Rural Districts',
            'department': departments[0],  # Education
        },
        {
            'name': 'Primary Health Center Upgrade',
            'description': 'Modernizing primary health centers with new equipment',
            'budget': Decimal('25000000.00'),
            'spent': Decimal('12000000.00'),
            'status': 'active',
            'priority': 'critical',
            'start_date': date.today() - timedelta(days=60),
            'end_date': date.today() + timedelta(days=120),
            'expected_beneficiaries': 10000,
            'location': 'Urban Areas',
            'department': departments[1],  # Healthcare
        },
        {
            'name': 'Rural Road Construction',
            'description': 'Building all-weather roads connecting villages',
            'budget': Decimal('40000000.00'),
            'spent': Decimal('20000000.00'),
            'status': 'active',
            'priority': 'high',
            'start_date': date.today() - timedelta(days=120),
            'end_date': date.today() + timedelta(days=240),
            'expected_beneficiaries': 15000,
            'location': 'Rural Villages',
            'department': departments[2],  # Infrastructure
        },
        {
            'name': 'Senior Citizen Support Program',
            'description': 'Monthly pension and healthcare support for elderly',
            'budget': Decimal('8000000.00'),
            'spent': Decimal('6000000.00'),
            'status': 'completed',
            'priority': 'medium',
            'start_date': date.today() - timedelta(days=365),
            'end_date': date.today() - timedelta(days=30),
            'expected_beneficiaries': 2000,
            'location': 'Statewide',
            'department': departments[3],  # Social Welfare
        }
    ]
    
    projects = []
    for project_data in projects_data:
        project, created = Project.objects.get_or_create(
            name=project_data['name'],
            defaults=project_data
        )
        projects.append(project)
        print(f"{'Created' if created else 'Found'} project: {project.name}")
    
    # Create fund flows
    fund_flows_data = [
        {
            'source': fund_sources[0],  # Central Government Grant
            'target_department': departments[0],  # Education
            'amount': Decimal('20000000.00'),
            'status': 'verified',
            'description': 'Annual education grant allocation',
            'transaction_date': date.today() - timedelta(days=30),
        },
        {
            'source': fund_sources[0],  # Central Government Grant
            'target_department': departments[1],  # Healthcare
            'amount': Decimal('30000000.00'),
            'status': 'verified',
            'description': 'Healthcare infrastructure funding',
            'transaction_date': date.today() - timedelta(days=25),
        },
        {
            'source': fund_sources[1],  # State Budget
            'target_project': projects[2],  # Rural Road Construction
            'amount': Decimal('25000000.00'),
            'status': 'under_review',
            'description': 'Infrastructure development funding',
            'transaction_date': date.today() - timedelta(days=15),
        },
        {
            'source': fund_sources[2],  # External Donations
            'target_project': projects[0],  # Digital Learning Initiative
            'amount': Decimal('5000000.00'),
            'status': 'verified',
            'description': 'NGO donation for education technology',
            'transaction_date': date.today() - timedelta(days=10),
        }
    ]
    
    for flow_data in fund_flows_data:
        flow, created = FundFlow.objects.get_or_create(
            source=flow_data['source'],
            target_department=flow_data.get('target_department'),
            target_project=flow_data.get('target_project'),
            amount=flow_data['amount'],
            defaults=flow_data
        )
        print(f"{'Created' if created else 'Found'} fund flow: {flow}")
    
    # Create trust indicators
    trust_indicators_data = [
        {
            'department': departments[0],  # Education
            'transparency_score': 95,
            'community_oversight_score': 88,
            'response_time_score': 92,
            'document_completeness_score': 96,
        },
        {
            'department': departments[1],  # Healthcare
            'transparency_score': 89,
            'community_oversight_score': 85,
            'response_time_score': 87,
            'document_completeness_score': 91,
        },
        {
            'department': departments[2],  # Infrastructure
            'transparency_score': 78,
            'community_oversight_score': 82,
            'response_time_score': 75,
            'document_completeness_score': 80,
        },
        {
            'department': departments[3],  # Social Welfare
            'transparency_score': 92,
            'community_oversight_score': 90,
            'response_time_score': 89,
            'document_completeness_score': 94,
        }
    ]
    
    for indicator_data in trust_indicators_data:
        indicator, created = TrustIndicator.objects.get_or_create(
            department=indicator_data['department'],
            defaults=indicator_data
        )
        print(f"{'Created' if created else 'Found'} trust indicator for {indicator.department.name}: {indicator.overall_score}/100")
    
    # Create sample impact metrics
    impact_metrics_data = [
        {
            'project': projects[0],  # Digital Learning Initiative
            'metric_type': 'beneficiaries',
            'value': Decimal('2500.00'),
            'unit': 'students',
            'date': date.today() - timedelta(days=30),
            'verified': True,
        },
        {
            'project': projects[1],  # Primary Health Center Upgrade
            'metric_type': 'efficiency',
            'value': Decimal('85.00'),
            'unit': 'percentage',
            'date': date.today() - timedelta(days=15),
            'verified': True,
        },
        {
            'project': projects[2],  # Rural Road Construction
            'metric_type': 'completion',
            'value': Decimal('50.00'),
            'unit': 'percentage',
            'date': date.today() - timedelta(days=7),
            'verified': False,
        }
    ]
    
    for metric_data in impact_metrics_data:
        metric, created = ImpactMetric.objects.get_or_create(
            project=metric_data['project'],
            metric_type=metric_data['metric_type'],
            date=metric_data['date'],
            defaults=metric_data
        )
        print(f"{'Created' if created else 'Found'} impact metric: {metric}")
    
    print("\nInitial data population completed successfully!")
    print(f"Created {len(departments)} departments")
    print(f"Created {len(fund_sources)} fund sources")
    print(f"Created {len(projects)} projects")
    print(f"Created {len(fund_flows_data)} fund flows")
    print(f"Created {len(trust_indicators_data)} trust indicators")
    print(f"Created {len(impact_metrics_data)} impact metrics")

if __name__ == "__main__":
    create_initial_data()
