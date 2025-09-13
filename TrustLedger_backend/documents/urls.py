from django.urls import path
from . import views

urlpatterns = [
    # Documents
    path('', views.DocumentListView.as_view(), name='document-list'),
    path('<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
    path('<int:document_id>/verify/', views.verify_document_view, name='verify-document'),
    path('search/', views.document_search_view, name='document-search'),
    path('statistics/', views.document_statistics_view, name='document-statistics'),
    
    # Document Verifications
    path('verifications/', views.DocumentVerificationListView.as_view(), name='document-verification-list'),
    path('verifications/<int:pk>/', views.DocumentVerificationDetailView.as_view(), name='document-verification-detail'),
    
    # Document Categories
    path('categories/', views.DocumentCategoryListView.as_view(), name='document-category-list'),
    path('categories/<int:pk>/', views.DocumentCategoryDetailView.as_view(), name='document-category-detail'),
    path('categories/list/', views.document_categories_view, name='document-categories'),
    
    # Document Templates
    path('templates/', views.DocumentTemplateListView.as_view(), name='document-template-list'),
    path('templates/<int:pk>/', views.DocumentTemplateDetailView.as_view(), name='document-template-detail'),
    path('templates/list/', views.document_templates_view, name='document-templates'),
]
