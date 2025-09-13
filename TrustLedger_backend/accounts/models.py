from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator


class User(AbstractUser):
    """Extended User model with role-based permissions"""
    ROLE_CHOICES = [
        ('citizen', 'Citizen'),
        ('department_head', 'Department Head'),
        ('auditor', 'Auditor'),
        ('committee', 'Committee Member'),
        ('admin', 'Administrator'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    department = models.ForeignKey('core.Department', on_delete=models.SET_NULL, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_department_head(self):
        return self.role == 'department_head'
    
    @property
    def is_auditor(self):
        return self.role in ['auditor', 'committee']
    
    @property
    def is_admin(self):
        return self.role == 'admin'


class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"