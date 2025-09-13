from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class DashboardMetrics(models.Model):
    """Model for storing dashboard metrics"""
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    utilized_funds = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    active_projects = models.PositiveIntegerField()
    anomalies_count = models.PositiveIntegerField()
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-calculated_at']
    
    def __str__(self):
        return f"Metrics - {self.calculated_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def utilization_percentage(self):
        """Calculate fund utilization percentage"""
        if self.total_budget > 0:
            return (self.utilized_funds / self.total_budget) * 100
        return 0


class SearchFilter(models.Model):
    """Model for storing search filter configurations"""
    name = models.CharField(max_length=100)
    department_id = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=50, blank=True)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    max_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    year = models.CharField(max_length=4, blank=True)
    verification_status = models.CharField(max_length=50, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_filters')
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} by {self.created_by.username}"


class AuditLog(models.Model):
    """Model for tracking all system activities"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('verify', 'Verify'),
        ('reject', 'Reject'),
        ('approve', 'Approve'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=255)
    changes = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} {self.action} {self.model_name} at {self.timestamp}"


class Report(models.Model):
    """Model for generating and storing reports"""
    REPORT_TYPES = [
        ('budget_summary', 'Budget Summary'),
        ('project_status', 'Project Status'),
        ('fund_flow', 'Fund Flow'),
        ('anomaly_report', 'Anomaly Report'),
        ('department_performance', 'Department Performance'),
        ('transparency_report', 'Transparency Report'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    parameters = models.JSONField()  # Store report parameters
    file_path = models.CharField(max_length=500, blank=True)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_reports')
    generated_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"


class Notification(models.Model):
    """Model for system notifications"""
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} for {self.user.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        from django.utils import timezone
        self.read_at = timezone.now()
        self.save()


class SystemConfiguration(models.Model):
    """Model for storing system configuration settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value}"