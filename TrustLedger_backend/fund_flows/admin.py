from django.contrib import admin
from .models import FundFlow, FundSource, Anomaly, TrustIndicator

@admin.register(FundFlow)
class FundFlowAdmin(admin.ModelAdmin):
    list_display = ['source', 'target_department', 'target_project', 'amount', 'status', 'transaction_date']
    list_filter = ['status', 'transaction_date', 'created_at']
    search_fields = ['source__name', 'target_department__name', 'target_project__name', 'description']
    ordering = ['-transaction_date']
    raw_id_fields = ['source', 'target_department', 'target_project', 'verified_by']

@admin.register(FundSource)
class FundSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'total_amount', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Anomaly)
class AnomalyAdmin(admin.ModelAdmin):
    list_display = ['fund_flow', 'severity', 'resolved', 'detected_by', 'detected_at']
    list_filter = ['severity', 'resolved', 'detected_at']
    search_fields = ['fund_flow__source__name', 'description']
    ordering = ['-detected_at']
    raw_id_fields = ['fund_flow', 'detected_by', 'resolved_by']

@admin.register(TrustIndicator)
class TrustIndicatorAdmin(admin.ModelAdmin):
    list_display = ['department', 'overall_score', 'transparency_score', 'calculated_at']
    list_filter = ['calculated_at', 'department']
    search_fields = ['department__name']
    ordering = ['-calculated_at']
    raw_id_fields = ['department']