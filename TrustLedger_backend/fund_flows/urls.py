from django.urls import path
from . import views

urlpatterns = [
    # Fund Sources
    path('sources/', views.FundSourceListView.as_view(), name='fund-source-list'),
    path('sources/<int:pk>/', views.FundSourceDetailView.as_view(), name='fund-source-detail'),
    
    # Fund Flows
    path('flows/', views.FundFlowListView.as_view(), name='fund-flow-list'),
    path('flows/<int:pk>/', views.FundFlowDetailView.as_view(), name='fund-flow-detail'),
    path('flows/<int:flow_id>/verify/', views.verify_fund_flow_view, name='verify-fund-flow'),
    path('flows/<int:flow_id>/flag-anomaly/', views.flag_anomaly_view, name='flag-anomaly'),
    path('diagram/', views.fund_flow_diagram_view, name='fund-flow-diagram'),
    
    # Anomalies
    path('anomalies/', views.AnomalyListView.as_view(), name='anomaly-list'),
    path('anomalies/<int:pk>/', views.AnomalyDetailView.as_view(), name='anomaly-detail'),
    path('anomalies/<int:pk>/resolve/', views.AnomalyResolveView.as_view(), name='anomaly-resolve'),
    path('anomalies/count/', views.anomalies_count_view, name='anomalies-count'),
    
    # Trust Indicators
    path('trust-indicators/', views.TrustIndicatorListView.as_view(), name='trust-indicator-list'),
    path('trust-indicators/<int:pk>/', views.TrustIndicatorDetailView.as_view(), name='trust-indicator-detail'),
    path('trust-indicators/summary/', views.trust_indicators_summary_view, name='trust-indicators-summary'),
    
    # Search
    path('search/transactions/', views.search_transactions_view, name='search-transactions'),
    path('search/projects/', views.search_projects_view, name='search-projects'),
]
