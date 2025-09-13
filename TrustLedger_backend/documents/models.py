from django.db import models
from django.contrib.auth import get_user_model
import os

User = get_user_model()


def document_upload_path(instance, filename):
    """Generate upload path for documents"""
    return f'documents/{instance.document_type}/{instance.uploaded_by.id}/{filename}'


class Document(models.Model):
    """Model for storing uploaded documents"""
    DOCUMENT_TYPES = [
        ('invoice', 'Invoice'),
        ('receipt', 'Receipt'),
        ('contract', 'Contract'),
        ('report', 'Report'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to=document_upload_path)
    size = models.PositiveIntegerField()  # File size in bytes
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    project = models.ForeignKey('core.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    fund_flow = models.ForeignKey('fund_flows.FundFlow', on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        return round(self.size / (1024 * 1024), 2)
    
    @property
    def file_extension(self):
        """Return file extension"""
        return os.path.splitext(self.file.name)[1].lower()


class DocumentVerification(models.Model):
    """Model for tracking document verification process"""
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='verification')
    verified_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='document_verifications')
    verification_notes = models.TextField(blank=True)
    verification_date = models.DateTimeField(auto_now_add=True)
    is_legitimate = models.BooleanField(default=True)
    issues_found = models.TextField(blank=True)
    
    def __str__(self):
        return f"Verification of {self.document.name} by {self.verified_by.username}"


class DocumentCategory(models.Model):
    """Model for categorizing documents"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    required_for_verification = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name


class DocumentTemplate(models.Model):
    """Model for document templates"""
    name = models.CharField(max_length=200)
    category = models.ForeignKey(DocumentCategory, on_delete=models.CASCADE, related_name='templates')
    template_file = models.FileField(upload_to='templates/')
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.category.name})"