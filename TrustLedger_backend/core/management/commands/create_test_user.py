from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Department

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a test user for development'

    def handle(self, *args, **options):
        # Create a test user
        username = 'admin'
        email = 'admin@trustledger.com'
        password = 'admin123'
        
        if User.objects.filter(username=username).exists():
            self.stdout.write(f'User {username} already exists')
            return
        
        # Get the first department for the user
        department = Department.objects.first()
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name='Admin',
            last_name='User',
            role='admin',
            department=department,
            is_verified=True
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Test user created successfully!\n'
                f'Username: {username}\n'
                f'Email: {email}\n'
                f'Password: {password}\n'
                f'Role: {user.role}'
            )
        )
