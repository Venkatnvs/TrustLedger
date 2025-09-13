from rest_framework import serializers
from .models import Department, Project, ImpactMetric, CommunityFeedback, BudgetVersion, AuditLog, FundAllocation, ProjectSpending
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
    remaining_budget = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    impact_metrics = ImpactMetricSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'budget', 'spent', 'status', 'priority',
            'start_date', 'end_date', 'expected_beneficiaries', 'location',
            'department', 'department_name', 
            'remaining_budget', 'completion_percentage', 'is_overdue', 'days_remaining',
            'is_public', 'impact_metrics', 'created_at', 'updated_at'
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
    remaining_budget = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'budget', 'spent', 'status', 'start_date', 'end_date',
            'department_name', 'remaining_budget', 'completion_percentage',
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


class CommunityFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for CommunityFeedback model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.get_full_name', read_only=True)
    
    class Meta:
        model = CommunityFeedback
        fields = [
            'id', 'user', 'user_name', 'project', 'project_name', 'department', 'department_name',
            'fund_flow', 'feedback_type', 'title', 'description', 'priority', 'is_public',
            'is_anonymous', 'status', 'response', 'responded_by', 'responded_by_name',
            'responded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'responded_at']
    
    def validate(self, attrs):
        """Validate feedback data"""
        project = attrs.get('project')
        department = attrs.get('department')
        fund_flow = attrs.get('fund_flow')
        
        # At least one target must be specified
        if not any([project, department, fund_flow]):
            raise serializers.ValidationError("At least one target (project, department, or fund flow) must be specified.")
        
        return attrs


class CommunityFeedbackCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating community feedback"""
    
    class Meta:
        model = CommunityFeedback
        fields = [
            'project', 'department', 'fund_flow', 'feedback_type', 'title',
            'description', 'priority', 'is_public', 'is_anonymous'
        ]
    
    def validate(self, attrs):
        """Validate feedback creation data"""
        project = attrs.get('project')
        department = attrs.get('department')
        fund_flow = attrs.get('fund_flow')
        
        # At least one target must be specified
        if not any([project, department, fund_flow]):
            raise serializers.ValidationError("At least one target (project, department, or fund flow) must be specified.")
        
        return attrs


class BudgetVersionSerializer(serializers.ModelSerializer):
    """Serializer for BudgetVersion model"""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = BudgetVersion
        fields = [
            'id', 'project', 'project_name', 'version_number', 'budget_amount',
            'change_reason', 'changed_by', 'changed_by_name', 'changed_at',
            'previous_version'
        ]
        read_only_fields = ['changed_at']


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


class DashboardMetricsSerializer(serializers.Serializer):
    """Serializer for dashboard metrics"""
    total_budget = serializers.DecimalField(max_digits=15, decimal_places=2)
    utilized_funds = serializers.DecimalField(max_digits=15, decimal_places=2)
    active_projects = serializers.IntegerField()
    anomalies_count = serializers.IntegerField()
    departments_count = serializers.IntegerField()
    trust_score = serializers.IntegerField()
    community_feedback_count = serializers.IntegerField()
    pending_verifications = serializers.IntegerField()


class FundAllocationSerializer(serializers.ModelSerializer):
    """Serializer for fund allocations"""
    allocated_by_name = serializers.CharField(source='allocated_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = FundAllocation
        fields = [
            'id', 'project', 'project_name', 'amount', 'allocation_type', 
            'source', 'description', 'allocated_by', 'allocated_by_name',
            'approved_by', 'approved_by_name', 'status', 'allocation_date',
            'effective_date', 'supporting_documents', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class FundAllocationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fund allocations"""
    
    class Meta:
        model = FundAllocation
        fields = [
            'project', 'amount', 'allocation_type', 'source', 'description',
            'allocation_date', 'effective_date', 'supporting_documents', 'notes'
        ]


class ProjectSpendingSerializer(serializers.ModelSerializer):
    """Serializer for ProjectSpending model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectSpending
        fields = [
            'id', 'project', 'project_name', 'amount', 'description', 'category',
            'transaction_date', 'supporting_documents', 'status', 'created_by',
            'created_by_name', 'approved_by', 'approved_by_name', 'approved_at',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class ProjectSpendingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ProjectSpending records"""
    
    class Meta:
        model = ProjectSpending
        fields = [
            'project', 'amount', 'description', 'category', 'transaction_date',
            'supporting_documents', 'status'
        ]
