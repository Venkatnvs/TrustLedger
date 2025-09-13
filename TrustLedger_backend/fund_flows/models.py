from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class FundSource(models.Model):
    """Source of funds (government, grants, donations, etc.)"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class FundFlow(models.Model):
    """Model for tracking fund flows between sources, departments, and projects"""
    STATUS_CHOICES = [
        ('verified', 'Verified'),
        ('under_review', 'Under Review'),
        ('anomaly', 'Anomaly'),
    ]
    
    source = models.ForeignKey(FundSource, on_delete=models.CASCADE, related_name='outgoing_flows')
    target_department = models.ForeignKey('core.Department', on_delete=models.CASCADE, null=True, blank=True, related_name='incoming_flows')
    target_project = models.ForeignKey('core.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='incoming_flows')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='under_review')
    description = models.TextField(blank=True)
    transaction_date = models.DateField()
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date']
    
    def __str__(self):
        target = self.target_project or self.target_department
        return f"{self.source.name} → {target} (₹{self.amount})"
    
    def clean(self):
        """Ensure either target_department or target_project is set, but not both"""
        from django.core.exceptions import ValidationError
        if not self.target_department and not self.target_project:
            raise ValidationError("Either target_department or target_project must be set.")
        if self.target_department and self.target_project:
            raise ValidationError("Cannot set both target_department and target_project.")


class Anomaly(models.Model):
    """Model for tracking detected anomalies in fund flows"""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    fund_flow = models.ForeignKey(FundFlow, on_delete=models.CASCADE, related_name='anomalies')
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    detected_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='detected_anomalies')
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_anomalies')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-detected_at']
    
    def __str__(self):
        return f"Anomaly in {self.fund_flow} - {self.get_severity_display()}"


class TrustIndicator(models.Model):
    """Model for tracking trust indicators and transparency metrics"""
    department = models.ForeignKey('core.Department', on_delete=models.CASCADE, related_name='trust_indicators')
    transparency_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    community_oversight_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    response_time_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    document_completeness_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-calculated_at']
    
    def __str__(self):
        return f"{self.department.name} Trust Score: {self.overall_score}"
    
    @property
    def overall_score(self):
        """Calculate overall trust score"""
        return (self.transparency_score + self.community_oversight_score + 
                self.response_time_score + self.document_completeness_score) // 4