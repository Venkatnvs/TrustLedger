from django.contrib import admin
from .models import Document, DocumentCategory, DocumentTemplate, DocumentVerification

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'document_type', 'verified', 'uploaded_at']
    list_filter = ['document_type', 'verified', 'uploaded_at', 'project__department']
    search_fields = ['name', 'project__name']
    ordering = ['-uploaded_at']
    raw_id_fields = ['project', 'uploaded_by', 'verified_by']

@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'required_for_verification']
    list_filter = ['required_for_verification']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    raw_id_fields = ['category', 'created_by']

@admin.register(DocumentVerification)
class DocumentVerificationAdmin(admin.ModelAdmin):
    list_display = ['document', 'verified_by', 'is_legitimate', 'verification_date']
    list_filter = ['is_legitimate', 'verification_date']
    search_fields = ['document__name', 'verified_by__username', 'verification_notes']
    ordering = ['-verification_date']
    raw_id_fields = ['document', 'verified_by']