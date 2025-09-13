from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# Swagger configuration
schema_view = get_schema_view(
    openapi.Info(
        title="TrustLedger API",
        default_version='v1',
        description="API for TrustLedger - Transparent Fund Flow Management",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="venkatnvs2005@gmail.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # JWT Authentication
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/core/', include('core.urls')),
    path('api/fund-flows/', include('fund_flows.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/ai/', include('ai_services.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
