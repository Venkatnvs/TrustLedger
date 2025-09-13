from rest_framework import serializers
from .models import Department, Project, ImpactMetric
from accounts.serializers import UserListSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    spent_amount = serializers.ReadOnlyField()
    remaining_budget = serializers.ReadOnlyField()
    projects_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'budget', 'head', 'head_name',
            'spent_amount', 'remaining_budget', 'projects_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_projects_count(self, obj):
        """Get count of projects in this department"""
        return obj.projects.count()


class DepartmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for department lists"""
    spent_amount = serializers.ReadOnlyField()
    remaining_budget = serializers.ReadOnlyField()
    projects_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'budget', 'spent_amount', 'remaining_budget',
            'projects_count', 'created_at'
        ]
    
    def get_projects_count(self, obj):
        """Get count of projects in this department"""
        return obj.projects.count()


class ImpactMetricSerializer(serializers.ModelSerializer):
    """Serializer for ImpactMetric model"""
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = ImpactMetric
        fields = [
            'id', 'project', 'metric_type', 'value', 'unit', 'date',
            'verified', 'verified_by', 'verified_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    remaining_budget = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    impact_metrics = ImpactMetricSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'budget', 'spent', 'status',
            'start_date', 'end_date', 'department', 'department_name',
            'manager', 'manager_name', 'remaining_budget', 'completion_percentage',
            'impact_metrics', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate project data"""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError("End date cannot be before start date.")
        
        return attrs


class ProjectListSerializer(serializers.ModelSerializer):
    """Simplified serializer for project lists"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    remaining_budget = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'budget', 'spent', 'status', 'start_date', 'end_date',
            'department_name', 'manager_name', 'remaining_budget', 'completion_percentage',
            'created_at'
        ]


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating projects"""
    
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'budget', 'status', 'start_date', 'end_date',
            'department', 'manager'
        ]
    
    def validate_budget(self, value):
        """Validate budget amount"""
        if value <= 0:
            raise serializers.ValidationError("Budget must be greater than 0.")
        return value


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating projects"""
    
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'budget', 'spent', 'status', 'start_date', 'end_date',
            'manager'
        ]
    
    def validate_spent(self, value):
        """Validate spent amount"""
        if value < 0:
            raise serializers.ValidationError("Spent amount cannot be negative.")
        return value
    
    def validate(self, attrs):
        """Validate project update data"""
        budget = attrs.get('budget', self.instance.budget if self.instance else None)
        spent = attrs.get('spent', self.instance.spent if self.instance else None)
        
        if budget and spent and spent > budget:
            raise serializers.ValidationError("Spent amount cannot exceed budget.")
        
        return attrs
