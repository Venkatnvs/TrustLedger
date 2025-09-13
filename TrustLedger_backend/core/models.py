from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class Department(models.Model):
    """Department model for organizing projects and budgets"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    head = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def spent_amount(self):
        """Calculate total amount spent by this department"""
        return sum(project.spent for project in self.projects.all())
    
    @property
    def remaining_budget(self):
        """Calculate remaining budget"""
        return self.budget - self.spent_amount


class Project(models.Model):
    """Project model for tracking individual projects"""
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    spent = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='projects')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.department.name})"
    
    @property
    def remaining_budget(self):
        """Calculate remaining budget for this project"""
        return self.budget - self.spent
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage based on spent amount"""
        if self.budget > 0:
            return min((self.spent / self.budget) * 100, 100)
        return 0


class ImpactMetric(models.Model):
    """Impact metrics for measuring project success"""
    METRIC_TYPES = [
        ('beneficiaries', 'Beneficiaries'),
        ('efficiency', 'Efficiency'),
        ('satisfaction', 'Satisfaction'),
        ('completion', 'Completion'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='impact_metrics')
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    date = models.DateField()
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.project.name} - {self.get_metric_type_display()}: {self.value} {self.unit}"