from django.contrib import admin
from .models import (
    Department, Project, ImpactMetric, CommunityFeedback, 
    BudgetVersion, FundAllocation, AuditLog
)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'budget', 'created_at']
    list_filter = ['created_at', 'budget']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'status', 'budget', 'spent', 'created_at']
    list_filter = ['status', 'department', 'created_at']
    search_fields = ['name', 'description', 'department__name']
    ordering = ['-created_at']
    raw_id_fields = ['department', 'manager']

@admin.register(ImpactMetric)
class ImpactMetricAdmin(admin.ModelAdmin):
    list_display = ['project', 'metric_type', 'value', 'unit', 'date', 'verified']
    list_filter = ['metric_type', 'date', 'verified', 'project__department']
    search_fields = ['project__name', 'metric_type']
    ordering = ['-date']
    raw_id_fields = ['project', 'verified_by']

@admin.register(CommunityFeedback)
class CommunityFeedbackAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'feedback_type', 'priority', 'created_at']
    list_filter = ['feedback_type', 'priority', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    ordering = ['-created_at']
    raw_id_fields = ['project', 'user', 'department']

@admin.register(BudgetVersion)
class BudgetVersionAdmin(admin.ModelAdmin):
    list_display = ['project', 'version_number', 'budget_amount', 'changed_by', 'changed_at']
    list_filter = ['changed_at', 'project__department']
    search_fields = ['project__name', 'version_number', 'change_reason']
    ordering = ['-changed_at']
    raw_id_fields = ['project', 'changed_by', 'previous_version']

@admin.register(FundAllocation)
class FundAllocationAdmin(admin.ModelAdmin):
    list_display = ['project', 'amount', 'allocation_type', 'status', 'allocated_by', 'allocation_date']
    list_filter = ['allocation_type', 'status', 'allocation_date', 'project__department']
    search_fields = ['project__name', 'description', 'source']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    raw_id_fields = ['project', 'allocated_by', 'approved_by']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_repr']
    ordering = ['-timestamp']
    raw_id_fields = ['user']
