from django.urls import path
from . import views

urlpatterns = [
    # Departments
    path('departments/', views.DepartmentListView.as_view(), name='department-list'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    path('departments/<int:department_id>/projects/', views.department_projects_view, name='department-projects'),
    
    # Projects
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_id>/impact-metrics/', views.project_impact_metrics_view, name='project-impact-metrics'),
    
    # Impact Metrics
    path('impact-metrics/', views.ImpactMetricListView.as_view(), name='impact-metric-list'),
    path('impact-metrics/<int:pk>/', views.ImpactMetricDetailView.as_view(), name='impact-metric-detail'),
    path('impact-metrics/<int:metric_id>/verify/', views.verify_impact_metric_view, name='verify-impact-metric'),
    
    # Analytics
    path('dashboard/metrics/', views.enhanced_dashboard_metrics_view, name='dashboard-metrics'),
    path('project-status-summary/', views.project_status_summary_view, name='project-status-summary'),
    path('department-performance/', views.department_performance_view, name='department-performance'),
    
    # Community Feedback
    path('community-feedback/', views.CommunityFeedbackListView.as_view(), name='community-feedback-list'),
    path('community-feedback/<int:pk>/', views.CommunityFeedbackDetailView.as_view(), name='community-feedback-detail'),
    path('community-feedback/<int:feedback_id>/respond/', views.respond_to_feedback_view, name='respond-to-feedback'),
    path('community-feedback/<int:feedback_id>/update-status/', views.update_feedback_status_view, name='update-feedback-status'),
    
    # Budget Versions
    path('budget-versions/', views.BudgetVersionListView.as_view(), name='budget-version-list'),
    path('projects/<int:project_id>/create-budget-version/', views.create_budget_version_view, name='create-budget-version'),
    
    # Audit Logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-log-list'),
    
    # Fund Allocations
    path('fund-allocations/', views.FundAllocationListView.as_view(), name='fund-allocation-list'),
    path('fund-allocations/<int:pk>/', views.FundAllocationDetailView.as_view(), name='fund-allocation-detail'),
    
    # Project Spending
    path('project-spending/', views.ProjectSpendingListView.as_view(), name='project-spending-list'),
    path('project-spending/<int:pk>/', views.ProjectSpendingDetailView.as_view(), name='project-spending-detail'),
    
    # Anomaly Detection
    path('run-anomaly-detection/', views.run_anomaly_detection_view, name='run-anomaly-detection'),
]
