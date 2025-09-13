from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Department(models.Model):
    """Department model for organizing projects and budgets"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    head = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_departments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def spent_amount(self):
        """Calculate total amount spent by this department"""
        return sum(project.spent for project in self.projects.filter(status__in=['active', 'completed']))
    
    @property
    def remaining_budget(self):
        """Calculate remaining budget"""
        return self.budget - self.spent_amount
    
    @property
    def active_projects_count(self):
        """Count of active projects"""
        return self.projects.filter(status='active').count()
    
    @property
    def completed_projects_count(self):
        """Count of completed projects"""
        return self.projects.filter(status='completed').count()


class Project(models.Model):
    """Project model for tracking individual projects"""
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    spent = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    expected_beneficiaries = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=200, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='projects')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_projects')
    is_public = models.BooleanField(default=True)
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
    
    @property
    def is_overdue(self):
        """Check if project is overdue"""
        if self.end_date and self.status in ['active', 'planning']:
            return timezone.now().date() > self.end_date
        return False
    
    @property
    def days_remaining(self):
        """Calculate days remaining until end date"""
        if self.end_date and self.status in ['active', 'planning']:
            delta = self.end_date - timezone.now().date()
            return max(0, delta.days)
        return None


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


class CommunityFeedback(models.Model):
    """Community feedback and suggestions on budget items"""
    FEEDBACK_TYPES = [
        ('question', 'Question'),
        ('suggestion', 'Suggestion'),
        ('concern', 'Concern'),
        ('complaint', 'Complaint'),
        ('praise', 'Praise'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedback')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='feedback', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='feedback', null=True, blank=True)
    fund_flow = models.ForeignKey('fund_flows.FundFlow', on_delete=models.CASCADE, related_name='feedback', null=True, blank=True)
    
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    is_public = models.BooleanField(default=True)
    is_anonymous = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('responded', 'Responded'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ], default='pending')
    
    response = models.TextField(blank=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='responded_feedback')
    responded_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_feedback_type_display()}"


class BudgetVersion(models.Model):
    """Version control for budget changes"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='budget_versions')
    version_number = models.PositiveIntegerField()
    budget_amount = models.DecimalField(max_digits=15, decimal_places=2)
    change_reason = models.TextField()
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    previous_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['project', 'version_number']
    
    def __str__(self):
        return f"{self.project.name} v{self.version_number}"


class AuditLog(models.Model):
    """Immutable audit trail for all changes"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('verify', 'Verify'),
        ('flag', 'Flag'),
        ('resolve', 'Resolve'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.PositiveIntegerField()
    object_repr = models.CharField(max_length=200)
    
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} {self.action} {self.model_name} {self.object_id}"