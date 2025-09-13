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
    path('dashboard/metrics/', views.dashboard_metrics_view, name='dashboard-metrics'),
    path('project-status-summary/', views.project_status_summary_view, name='project-status-summary'),
    path('department-performance/', views.department_performance_view, name='department-performance'),
]
