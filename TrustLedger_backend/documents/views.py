from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.http import FileResponse, Http404
from django.conf import settings
import os
from .models import Document, DocumentVerification, DocumentCategory, DocumentTemplate
from .serializers import (
    DocumentSerializer, DocumentListSerializer, DocumentUploadSerializer,
    DocumentVerificationSerializer, DocumentVerificationCreateSerializer,
    DocumentCategorySerializer, DocumentTemplateSerializer,
    DocumentTemplateCreateSerializer, DocumentSearchSerializer
)


class DocumentListView(generics.ListCreateAPIView):
    """View for listing and creating documents"""
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['document_type', 'project', 'fund_flow', 'verified', 'uploaded_by']
    search_fields = ['name']
    ordering_fields = ['name', 'uploaded_at', 'size']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        user = self.request.user
        print(f"DocumentListView - User: {user.username}, Role: {user.role}, Is admin: {user.is_admin}, Is auditor: {user.is_auditor}")
        
        # Temporarily return all documents for debugging
        queryset = Document.objects.all()
        print(f"Documents count: {queryset.count()}")
        return queryset
        
        # Original logic (commented out for debugging)
        # if user.is_admin or user.is_auditor:
        #     return Document.objects.all()
        # elif user.is_department_head and user.department:
        #     return Document.objects.filter(
        #         Q(project__department=user.department) |
        #         Q(fund_flow__target_department=user.department)
        #     )
        # else:
        #     return Document.objects.filter(
        #         Q(uploaded_by=user) |
        #         Q(project__manager=user) |
        #         Q(fund_flow__target_project__manager=user)
        #     )
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DocumentListSerializer
        return DocumentUploadSerializer


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for document details"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentVerificationListView(generics.ListCreateAPIView):
    """View for listing and creating document verifications"""
    queryset = DocumentVerification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_legitimate', 'verified_by']
    search_fields = ['verification_notes', 'issues_found']
    ordering_fields = ['verification_date']
    ordering = ['-verification_date']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DocumentVerificationSerializer
        return DocumentVerificationCreateSerializer


class DocumentVerificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for document verification details"""
    queryset = DocumentVerification.objects.all()
    serializer_class = DocumentVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentCategoryListView(generics.ListCreateAPIView):
    """View for listing and creating document categories"""
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'description']
    ordering = ['name']


class DocumentCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for document category details"""
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentTemplateListView(generics.ListCreateAPIView):
    """View for listing and creating document templates"""
    queryset = DocumentTemplate.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DocumentTemplateSerializer
        return DocumentTemplateCreateSerializer


class DocumentTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for document template details"""
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_document_view(request, document_id):
    """View for verifying documents"""
    if not request.user.is_auditor:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        document = Document.objects.get(id=document_id)
        document.verified = True
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        
        # Create verification record
        DocumentVerification.objects.create(
            document=document,
            verified_by=request.user,
            verification_notes=request.data.get('notes', ''),
            is_legitimate=request.data.get('is_legitimate', True),
            issues_found=request.data.get('issues_found', '')
        )
        
        return Response({'message': 'Document verified successfully'}, status=status.HTTP_200_OK)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_search_view(request):
    """View for searching documents"""
    serializer = DocumentSearchSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Build query
    query = Q()
    
    if serializer.validated_data.get('name'):
        query &= Q(name__icontains=serializer.validated_data['name'])
    
    if serializer.validated_data.get('document_type'):
        query &= Q(document_type=serializer.validated_data['document_type'])
    
    if serializer.validated_data.get('project_id'):
        query &= Q(project_id=serializer.validated_data['project_id'])
    
    if serializer.validated_data.get('fund_flow_id'):
        query &= Q(fund_flow_id=serializer.validated_data['fund_flow_id'])
    
    if serializer.validated_data.get('verified') is not None:
        query &= Q(verified=serializer.validated_data['verified'])
    
    if serializer.validated_data.get('uploaded_by_id'):
        query &= Q(uploaded_by_id=serializer.validated_data['uploaded_by_id'])
    
    if serializer.validated_data.get('date_from'):
        query &= Q(uploaded_at__date__gte=serializer.validated_data['date_from'])
    
    if serializer.validated_data.get('date_to'):
        query &= Q(uploaded_at__date__lte=serializer.validated_data['date_to'])
    
    # Apply user permissions
    user = request.user
    if not (user.is_admin or user.is_auditor):
        if user.is_department_head and user.department:
            query &= Q(
                Q(project__department=user.department) |
                Q(fund_flow__target_department=user.department)
            )
        else:
            query &= Q(
                Q(uploaded_by=user) |
                Q(project__manager=user) |
                Q(fund_flow__target_project__manager=user)
            )
    
    documents = Document.objects.filter(query).order_by('-uploaded_at')
    serializer = DocumentListSerializer(documents, many=True)
    
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_statistics_view(request):
    """View for document statistics"""
    user = request.user
    
    # Get documents based on user permissions
    if user.is_admin or user.is_auditor:
        documents = Document.objects.all()
    elif user.is_department_head and user.department:
        documents = Document.objects.filter(
            Q(project__department=user.department) |
            Q(fund_flow__target_department=user.department)
        )
    else:
        documents = Document.objects.filter(
            Q(uploaded_by=user) |
            Q(project__manager=user) |
            Q(fund_flow__target_project__manager=user)
        )
    
    # Calculate statistics
    total_documents = documents.count()
    verified_documents = documents.filter(verified=True).count()
    pending_verification = documents.filter(verified=False).count()
    
    # Count by document type
    type_counts = {}
    for doc_type, _ in Document.DOCUMENT_TYPES:
        type_counts[doc_type] = documents.filter(document_type=doc_type).count()
    
    # Calculate total size
    total_size = documents.aggregate(total=Sum('size'))['total'] or 0
    total_size_mb = round(total_size / (1024 * 1024), 2)
    
    statistics = {
        'total_documents': total_documents,
        'verified_documents': verified_documents,
        'pending_verification': pending_verification,
        'verification_rate': round((verified_documents / total_documents * 100), 2) if total_documents > 0 else 0,
        'type_counts': type_counts,
        'total_size_mb': total_size_mb,
    }
    
    return Response(statistics, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_categories_view(request):
    """View for getting document categories"""
    categories = DocumentCategory.objects.all()
    serializer = DocumentCategorySerializer(categories, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def document_templates_view(request):
    """View for getting document templates"""
    templates = DocumentTemplate.objects.filter(is_active=True)
    serializer = DocumentTemplateSerializer(templates, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def document_file_view(request, document_id):
    """View for serving document files with authentication"""
    try:
        document = Document.objects.get(id=document_id)
        
        # Check if user has permission to view this document
        user = request.user
        # Get the file path
        file_path = document.file.path
        if not os.path.exists(file_path):
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Serve the file
        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{document.name}"'
        response['Content-Type'] = 'application/octet-stream'
        return response
        
    except Document.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)