from django.contrib import admin
from .models import (
    DashboardMetrics, SearchFilter, Report, Notification, 
    SystemConfiguration, AuditLog
)

@admin.register(DashboardMetrics)
class DashboardMetricsAdmin(admin.ModelAdmin):
    list_display = ['calculated_at', 'total_budget', 'utilized_funds', 'active_projects', 'anomalies_count']
    list_filter = ['calculated_at']
    ordering = ['-calculated_at']

@admin.register(SearchFilter)
class SearchFilterAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'department_id', 'status', 'created_at']
    list_filter = ['department_id', 'status', 'created_at']
    search_fields = ['name', 'created_by__username']
    ordering = ['-created_at']
    raw_id_fields = ['created_by']

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'generated_by', 'is_public', 'generated_at']
    list_filter = ['report_type', 'is_public', 'generated_at']
    search_fields = ['name', 'generated_by__username']
    ordering = ['-generated_at']
    raw_id_fields = ['generated_by']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    ordering = ['-created_at']
    raw_id_fields = ['user']

@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_by', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['key', 'description']
    ordering = ['key']
    raw_id_fields = ['updated_by']

@admin.register(AuditLog)
class AnalyticsAuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_repr']
    ordering = ['-timestamp']
    raw_id_fields = ['user']