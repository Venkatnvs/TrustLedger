from django.urls import path
from . import views

urlpatterns = [
    # Search Filters
    path('search-filters/', views.SearchFilterListView.as_view(), name='search-filter-list'),
    path('search-filters/<int:pk>/', views.SearchFilterDetailView.as_view(), name='search-filter-detail'),
    
    # Audit Logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-log-list'),
    
    # Reports
    path('reports/', views.ReportListView.as_view(), name='report-list'),
    path('reports/<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('notifications/<int:notification_id>/mark-read/', views.notification_mark_read_view, name='notification-mark-read'),
    path('notifications/mark-all-read/', views.notification_mark_all_read_view, name='notification-mark-all-read'),
    path('notifications/unread-count/', views.unread_notifications_count_view, name='unread-notifications-count'),
    
    # System Configuration
    path('configurations/', views.SystemConfigurationListView.as_view(), name='system-configuration-list'),
    path('configurations/<int:pk>/', views.SystemConfigurationDetailView.as_view(), name='system-configuration-detail'),
    
    # Analytics Dashboard
    path('dashboard/', views.analytics_dashboard_view, name='analytics-dashboard'),
]
