from rest_framework import serializers
from .models import FundSource, FundFlow, Anomaly, TrustIndicator
from core.serializers import DepartmentListSerializer, ProjectListSerializer


class FundSourceSerializer(serializers.ModelSerializer):
    """Serializer for FundSource model"""
    
    class Meta:
        model = FundSource
        fields = ['id', 'name', 'description', 'total_amount', 'created_at']
        read_only_fields = ['created_at']


class FundFlowSerializer(serializers.ModelSerializer):
    """Serializer for FundFlow model"""
    source_name = serializers.CharField(source='source.name', read_only=True)
    target_department_name = serializers.CharField(source='target_department.name', read_only=True)
    target_project_name = serializers.CharField(source='target_project.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    target_info = serializers.SerializerMethodField()
    
    class Meta:
        model = FundFlow
        fields = [
            'id', 'source', 'source_name', 'target_department', 'target_department_name',
            'target_project', 'target_project_name', 'amount', 'status', 'description',
            'transaction_date', 'verified_by', 'verified_by_name', 'verified_at',
            'target_info', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'verified_at']
    
    def get_target_info(self, obj):
        """Get target information (department or project)"""
        if obj.target_department:
            return {
                'type': 'department',
                'id': obj.target_department.id,
                'name': obj.target_department.name
            }
        elif obj.target_project:
            return {
                'type': 'project',
                'id': obj.target_project.id,
                'name': obj.target_project.name,
                'department': obj.target_project.department.name
            }
        return None
    
    def validate(self, attrs):
        """Validate fund flow data"""
        target_department = attrs.get('target_department')
        target_project = attrs.get('target_project')
        
        if not target_department and not target_project:
            raise serializers.ValidationError("Either target_department or target_project must be specified.")
        
        if target_department and target_project:
            raise serializers.ValidationError("Cannot specify both target_department and target_project.")
        
        return attrs


class FundFlowListSerializer(serializers.ModelSerializer):
    """Simplified serializer for fund flow lists"""
    source_name = serializers.CharField(source='source.name', read_only=True)
    target_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FundFlow
        fields = [
            'id', 'source_name', 'target_name', 'amount', 'status',
            'transaction_date', 'created_at'
        ]
    
    def get_target_name(self, obj):
        """Get target name (department or project)"""
        if obj.target_department:
            return obj.target_department.name
        elif obj.target_project:
            return f"{obj.target_project.name} ({obj.target_project.department.name})"
        return None


class AnomalySerializer(serializers.ModelSerializer):
    """Serializer for Anomaly model"""
    fund_flow_info = FundFlowListSerializer(source='fund_flow', read_only=True)
    detected_by_name = serializers.CharField(source='detected_by.get_full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Anomaly
        fields = [
            'id', 'fund_flow', 'fund_flow_info', 'description', 'severity',
            'detected_by', 'detected_by_name', 'detected_at', 'resolved',
            'resolved_by', 'resolved_by_name', 'resolved_at', 'resolution_notes'
        ]
        read_only_fields = ['detected_at', 'resolved_at']


class AnomalyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating anomalies"""
    
    class Meta:
        model = Anomaly
        fields = ['fund_flow', 'description', 'severity']
    
    def create(self, validated_data):
        """Create anomaly with current user as detector"""
        validated_data['detected_by'] = self.context['request'].user
        return super().create(validated_data)


class AnomalyResolveSerializer(serializers.ModelSerializer):
    """Serializer for resolving anomalies"""
    
    class Meta:
        model = Anomaly
        fields = ['resolution_notes']
    
    def update(self, instance, validated_data):
        """Resolve anomaly"""
        instance.resolved = True
        instance.resolved_by = self.context['request'].user
        from django.utils import timezone
        instance.resolved_at = timezone.now()
        instance.resolution_notes = validated_data.get('resolution_notes', '')
        instance.save()
        return instance


class TrustIndicatorSerializer(serializers.ModelSerializer):
    """Serializer for TrustIndicator model"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    overall_score = serializers.ReadOnlyField()
    
    class Meta:
        model = TrustIndicator
        fields = [
            'id', 'department', 'department_name', 'transparency_score',
            'community_oversight_score', 'response_time_score',
            'document_completeness_score', 'overall_score', 'calculated_at'
        ]
        read_only_fields = ['calculated_at']


class TrustIndicatorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating trust indicators"""
    
    class Meta:
        model = TrustIndicator
        fields = [
            'department', 'transparency_score', 'community_oversight_score',
            'response_time_score', 'document_completeness_score'
        ]
    
    def validate(self, attrs):
        """Validate trust indicator scores"""
        scores = [
            attrs.get('transparency_score'),
            attrs.get('community_oversight_score'),
            attrs.get('response_time_score'),
            attrs.get('document_completeness_score')
        ]
        
        for score in scores:
            if score < 0 or score > 100:
                raise serializers.ValidationError("All scores must be between 0 and 100.")
        
        return attrs


class FundFlowNodeSerializer(serializers.Serializer):
    """Serializer for fund flow diagram nodes"""
    id = serializers.CharField()
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    type = serializers.CharField()
    status = serializers.CharField()
    position = serializers.DictField()


class FundFlowLinkSerializer(serializers.Serializer):
    """Serializer for fund flow diagram links"""
    source = serializers.CharField()
    target = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    status = serializers.CharField()


class FundFlowDiagramSerializer(serializers.Serializer):
    """Serializer for fund flow diagram data"""
    nodes = FundFlowNodeSerializer(many=True)
    links = FundFlowLinkSerializer(many=True)
