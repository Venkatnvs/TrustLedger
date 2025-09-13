from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.logout_view, name='user-logout'),
    
    # User management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # User roles and verification
    path('roles/', views.user_roles_view, name='user-roles'),
    path('verify/<int:user_id>/', views.verify_user_view, name='verify-user'),
    path('dashboard/', views.user_dashboard_view, name='user-dashboard'),
]
