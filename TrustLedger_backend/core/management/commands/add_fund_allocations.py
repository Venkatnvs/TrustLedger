from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Project, Department
from datetime import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Add initial fund allocations for existing projects'

    def handle(self, *args, **options):
        # Get or create a system user for allocations
        system_user, created = User.objects.get_or_create(
            username='system',
            defaults={
                'email': 'system@trustledger.com',
                'first_name': 'System',
                'last_name': 'User',
                'role': 'admin',
                'is_verified': True
            }
        )
        
        if created:
            self.stdout.write('Created system user for fund allocations')
        
        # Get all projects
        projects = Project.objects.all()
        
        for project in projects:
            # Check if project already has fund allocation
            if hasattr(project, 'fund_allocations') and project.fund_allocations.exists():
                self.stdout.write(f'Project {project.name} already has fund allocations')
                continue
            
            # Create initial fund allocation
            from core.models import FundAllocation
            
            allocation = FundAllocation.objects.create(
                project=project,
                amount=project.budget,
                allocation_type='initial',
                source='Annual Budget Allocation',
                description=f'Initial funding allocation for {project.name}',
                allocated_by=system_user,
                approved_by=system_user,
                status='approved',
                allocation_date=project.created_at.date(),
                effective_date=project.created_at.date(),
                supporting_documents='Budget_2025.pdf',
                notes=f'Approved as part of annual budget cycle for {project.department.name if project.department else "Unknown Department"}'
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created fund allocation for {project.name}: {allocation.amount}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully added fund allocations for {projects.count()} projects'
            )
        )
