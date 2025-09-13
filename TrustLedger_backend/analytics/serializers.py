from rest_framework import serializers
from .models import (
    DashboardMetrics, SearchFilter, AuditLog, Report, 
    Notification, SystemConfiguration
)


class DashboardMetricsSerializer(serializers.ModelSerializer):
    """Serializer for DashboardMetrics model"""
    utilization_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = DashboardMetrics
        fields = [
            'id', 'total_budget', 'utilized_funds', 'active_projects',
            'anomalies_count', 'utilization_percentage', 'calculated_at'
        ]
        read_only_fields = ['calculated_at']


class SearchFilterSerializer(serializers.ModelSerializer):
    """Serializer for SearchFilter model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = SearchFilter
        fields = [
            'id', 'name', 'department_id', 'status', 'min_amount', 'max_amount',
            'year', 'verification_status', 'created_by', 'created_by_name',
            'created_at', 'is_public'
        ]
        read_only_fields = ['created_at']


class SearchFilterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating search filters"""
    
    class Meta:
        model = SearchFilter
        fields = [
            'name', 'department_id', 'status', 'min_amount', 'max_amount',
            'year', 'verification_status', 'is_public'
        ]
    
    def create(self, validated_data):
        """Create search filter with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'model_name', 'object_id',
            'object_repr', 'changes', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model"""
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'report_type', 'parameters', 'file_path',
            'generated_by', 'generated_by_name', 'generated_at', 'is_public'
        ]
        read_only_fields = ['generated_at']


class ReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reports"""
    
    class Meta:
        model = Report
        fields = ['name', 'report_type', 'parameters', 'is_public']
    
    def create(self, validated_data):
        """Create report with current user as generator"""
        validated_data['generated_by'] = self.context['request'].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'is_read',
            'created_at', 'read_at'
        ]
        read_only_fields = ['created_at', 'read_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = ['user', 'title', 'message', 'notification_type']
    
    def create(self, validated_data):
        """Create notification"""
        return super().create(validated_data)


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for SystemConfiguration model"""
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'key', 'value', 'description', 'updated_by', 'updated_by_name', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class SystemConfigurationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating system configuration"""
    
    class Meta:
        model = SystemConfiguration
        fields = ['value', 'description']
    
    def update(self, instance, validated_data):
        """Update configuration with current user as updater"""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class AnalyticsDataSerializer(serializers.Serializer):
    """Serializer for analytics data"""
    total_budget = serializers.DecimalField(max_digits=15, decimal_places=2)
    utilized_funds = serializers.DecimalField(max_digits=15, decimal_places=2)
    active_projects = serializers.IntegerField()
    anomalies_count = serializers.IntegerField()
    departments_count = serializers.IntegerField()
    users_count = serializers.IntegerField()
    documents_count = serializers.IntegerField()
    fund_flows_count = serializers.IntegerField()


class DepartmentPerformanceSerializer(serializers.Serializer):
    """Serializer for department performance data"""
    department_id = serializers.IntegerField()
    department_name = serializers.CharField()
    budget = serializers.DecimalField(max_digits=15, decimal_places=2)
    spent = serializers.DecimalField(max_digits=15, decimal_places=2)
    utilization_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    projects_count = serializers.IntegerField()
    active_projects_count = serializers.IntegerField()
    completed_projects_count = serializers.IntegerField()
    trust_score = serializers.IntegerField()


class ProjectStatusSerializer(serializers.Serializer):
    """Serializer for project status data"""
    project_id = serializers.IntegerField()
    project_name = serializers.CharField()
    department_name = serializers.CharField()
    status = serializers.CharField()
    budget = serializers.DecimalField(max_digits=15, decimal_places=2)
    spent = serializers.DecimalField(max_digits=15, decimal_places=2)
    completion_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    start_date = serializers.DateField()
    end_date = serializers.DateField(allow_null=True)
    days_remaining = serializers.IntegerField(allow_null=True)
