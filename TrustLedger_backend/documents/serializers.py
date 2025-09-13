from rest_framework import serializers
from .models import Document, DocumentVerification, DocumentCategory, DocumentTemplate
from core.serializers import ProjectListSerializer
from fund_flows.serializers import FundFlowListSerializer


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    fund_flow_info = FundFlowListSerializer(source='fund_flow', read_only=True)
    file_size_mb = serializers.ReadOnlyField()
    file_extension = serializers.ReadOnlyField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'name', 'document_type', 'file', 'size', 'file_size_mb',
            'file_extension', 'uploaded_by', 'uploaded_by_name', 'project',
            'project_name', 'fund_flow', 'fund_flow_info', 'verified',
            'verified_by', 'verified_by_name', 'verified_at', 'uploaded_at'
        ]
        read_only_fields = ['size', 'uploaded_at', 'verified_at']


class DocumentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for document lists"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size_mb = serializers.ReadOnlyField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'name', 'document_type', 'file_size_mb', 'uploaded_by_name',
            'verified', 'uploaded_at'
        ]


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for document upload"""
    
    class Meta:
        model = Document
        fields = [
            'name', 'document_type', 'file', 'project', 'fund_flow'
        ]
    
    def create(self, validated_data):
        """Create document with current user as uploader"""
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentVerificationSerializer(serializers.ModelSerializer):
    """Serializer for DocumentVerification model"""
    document_name = serializers.CharField(source='document.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentVerification
        fields = [
            'id', 'document', 'document_name', 'verified_by', 'verified_by_name',
            'verification_notes', 'verification_date', 'is_legitimate', 'issues_found'
        ]
        read_only_fields = ['verification_date']


class DocumentVerificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating document verifications"""
    
    class Meta:
        model = DocumentVerification
        fields = ['document', 'verification_notes', 'is_legitimate', 'issues_found']
    
    def create(self, validated_data):
        """Create verification with current user as verifier"""
        validated_data['verified_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentCategorySerializer(serializers.ModelSerializer):
    """Serializer for DocumentCategory model"""
    
    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'description', 'required_for_verification']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for DocumentTemplate model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'category', 'category_name', 'template_file',
            'description', 'created_by', 'created_by_name', 'created_at', 'is_active'
        ]
        read_only_fields = ['created_at']


class DocumentTemplateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating document templates"""
    
    class Meta:
        model = DocumentTemplate
        fields = ['name', 'category', 'template_file', 'description']
    
    def create(self, validated_data):
        """Create template with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DocumentSearchSerializer(serializers.Serializer):
    """Serializer for document search filters"""
    name = serializers.CharField(required=False)
    document_type = serializers.CharField(required=False)
    project_id = serializers.IntegerField(required=False)
    fund_flow_id = serializers.IntegerField(required=False)
    verified = serializers.BooleanField(required=False)
    uploaded_by_id = serializers.IntegerField(required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
