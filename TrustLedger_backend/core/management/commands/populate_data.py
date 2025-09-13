from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Sum
from core.models import Department, Project, ImpactMetric
from fund_flows.models import FundSource, FundFlow, TrustIndicator
from documents.models import Document, DocumentCategory
from analytics.models import DashboardMetrics
from decimal import Decimal
from datetime import date, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create users
        self.create_users()
        
        # Create departments
        self.create_departments()
        
        # Create projects
        self.create_projects()
        
        # Create fund sources and flows
        self.create_fund_flows()
        
        # Create impact metrics
        self.create_impact_metrics()
        
        # Create trust indicators
        self.create_trust_indicators()
        
        # Create document categories
        self.create_document_categories()
        
        # Create dashboard metrics
        self.create_dashboard_metrics()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated database with sample data!')
        )

    def create_users(self):
        """Create sample users"""
        users_data = [
            {'username': 'auditor', 'email': 'auditor@trustledger.com', 'role': 'auditor', 'first_name': 'John', 'last_name': 'Auditor'},
            {'username': 'citizen', 'email': 'citizen@trustledger.com', 'role': 'citizen', 'first_name': 'Jane', 'last_name': 'Citizen'},
            {'username': 'committee', 'email': 'committee@trustledger.com', 'role': 'committee', 'first_name': 'Bob', 'last_name': 'Committee'},
            {'username': 'dept_head', 'email': 'dept@trustledger.com', 'role': 'department_head', 'first_name': 'Alice', 'last_name': 'Manager'},
        ]
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_verified': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username}')

    def create_departments(self):
        """Create sample departments"""
        departments_data = [
            {'name': 'Education Department', 'description': 'Manages educational projects and initiatives', 'budget': 10000000},
            {'name': 'Healthcare Department', 'description': 'Oversees healthcare and medical projects', 'budget': 8000000},
            {'name': 'Infrastructure Department', 'description': 'Handles infrastructure and construction projects', 'budget': 12000000},
            {'name': 'Social Welfare Department', 'description': 'Manages social welfare and community programs', 'budget': 6000000},
        ]
        
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults={
                    'description': dept_data['description'],
                    'budget': dept_data['budget'],
                    'head': User.objects.filter(role='department_head').first(),
                }
            )
            if created:
                self.stdout.write(f'Created department: {dept.name}')

    def create_projects(self):
        """Create sample projects"""
        departments = Department.objects.all()
        users = User.objects.all()
        
        projects_data = [
            {'name': 'Classroom Construction', 'description': 'Building new classrooms in rural schools', 'budget': 5000000, 'department': 'Education Department'},
            {'name': 'IT Equipment Upgrade', 'description': 'Upgrading computer labs in schools', 'budget': 2000000, 'department': 'Education Department'},
            {'name': 'Medical Equipment', 'description': 'Purchasing medical equipment for hospitals', 'budget': 3000000, 'department': 'Healthcare Department'},
            {'name': 'Road Construction', 'description': 'Building new roads in rural areas', 'budget': 4000000, 'department': 'Infrastructure Department'},
            {'name': 'Water Supply Project', 'description': 'Installing water supply systems', 'budget': 2500000, 'department': 'Infrastructure Department'},
            {'name': 'Community Center', 'description': 'Building community centers', 'budget': 1500000, 'department': 'Social Welfare Department'},
        ]
        
        for project_data in projects_data:
            dept = Department.objects.get(name=project_data['department'])
            project, created = Project.objects.get_or_create(
                name=project_data['name'],
                defaults={
                    'description': project_data['description'],
                    'budget': project_data['budget'],
                    'spent': random.randint(0, int(project_data['budget'] * 0.8)),
                    'status': random.choice(['planning', 'active', 'completed']),
                    'start_date': date.today() - timedelta(days=random.randint(30, 365)),
                    'end_date': date.today() + timedelta(days=random.randint(30, 180)),
                    'department': dept,
                    'manager': random.choice(users),
                }
            )
            if created:
                self.stdout.write(f'Created project: {project.name}')

    def create_fund_flows(self):
        """Create sample fund sources and flows"""
        # Create fund sources
        sources_data = [
            {'name': 'Government Grant', 'description': 'Central government funding', 'total_amount': 20000000},
            {'name': 'Private Donations', 'description': 'Private sector donations', 'total_amount': 5000000},
            {'name': 'CSR Funds', 'description': 'Corporate Social Responsibility funds', 'total_amount': 3000000},
            {'name': 'International Aid', 'description': 'International development aid', 'total_amount': 4000000},
        ]
        
        for source_data in sources_data:
            source, created = FundSource.objects.get_or_create(
                name=source_data['name'],
                defaults={
                    'description': source_data['description'],
                    'total_amount': source_data['total_amount'],
                }
            )
            if created:
                self.stdout.write(f'Created fund source: {source.name}')
        
        # Create fund flows
        sources = FundSource.objects.all()
        departments = Department.objects.all()
        projects = Project.objects.all()
        
        for i in range(20):
            source = random.choice(sources)
            target_type = random.choice(['department', 'project'])
            
            if target_type == 'department':
                target = random.choice(departments)
            else:
                target = random.choice(projects)
            
            flow, created = FundFlow.objects.get_or_create(
                source=source,
                target_department=target if target_type == 'department' else None,
                target_project=target if target_type == 'project' else None,
                defaults={
                    'amount': random.randint(100000, 2000000),
                    'status': random.choice(['verified', 'under_review', 'anomaly']),
                    'description': f'Fund transfer from {source.name} to {target.name}',
                    'transaction_date': date.today() - timedelta(days=random.randint(1, 90)),
                }
            )
            if created:
                self.stdout.write(f'Created fund flow: {flow}')

    def create_impact_metrics(self):
        """Create sample impact metrics"""
        projects = Project.objects.all()
        users = User.objects.all()
        
        metric_types = ['beneficiaries', 'efficiency', 'satisfaction', 'completion']
        units = ['people', '%', 'rating', '%']
        
        for project in projects:
            for i in range(random.randint(2, 5)):
                metric, created = ImpactMetric.objects.get_or_create(
                    project=project,
                    metric_type=random.choice(metric_types),
                    defaults={
                        'value': random.randint(50, 100),
                        'unit': random.choice(units),
                        'date': date.today() - timedelta(days=random.randint(1, 30)),
                        'verified': random.choice([True, False]),
                        'verified_by': random.choice(users) if random.choice([True, False]) else None,
                    }
                )
                if created:
                    self.stdout.write(f'Created impact metric for {project.name}')

    def create_trust_indicators(self):
        """Create sample trust indicators"""
        departments = Department.objects.all()
        
        for dept in departments:
            indicator, created = TrustIndicator.objects.get_or_create(
                department=dept,
                defaults={
                    'transparency_score': random.randint(70, 100),
                    'community_oversight_score': random.randint(60, 95),
                    'response_time_score': random.randint(65, 90),
                    'document_completeness_score': random.randint(75, 100),
                }
            )
            if created:
                self.stdout.write(f'Created trust indicator for {dept.name}')

    def create_document_categories(self):
        """Create sample document categories"""
        categories_data = [
            {'name': 'Invoices', 'description': 'Financial invoices and receipts', 'required_for_verification': True},
            {'name': 'Contracts', 'description': 'Project contracts and agreements', 'required_for_verification': True},
            {'name': 'Reports', 'description': 'Project progress and completion reports', 'required_for_verification': False},
            {'name': 'Certificates', 'description': 'Certificates and compliance documents', 'required_for_verification': True},
        ]
        
        for cat_data in categories_data:
            category, created = DocumentCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'required_for_verification': cat_data['required_for_verification'],
                }
            )
            if created:
                self.stdout.write(f'Created document category: {category.name}')

    def create_dashboard_metrics(self):
        """Create sample dashboard metrics"""
        total_budget = Department.objects.aggregate(total=Sum('budget'))['total'] or 0
        utilized_funds = Project.objects.aggregate(total=Sum('spent'))['total'] or 0
        active_projects = Project.objects.filter(status='active').count()
        anomalies_count = FundFlow.objects.filter(status='anomaly').count()
        
        metrics, created = DashboardMetrics.objects.get_or_create(
            defaults={
                'total_budget': total_budget,
                'utilized_funds': utilized_funds,
                'active_projects': active_projects,
                'anomalies_count': anomalies_count,
            }
        )
        if created:
            self.stdout.write('Created dashboard metrics')
