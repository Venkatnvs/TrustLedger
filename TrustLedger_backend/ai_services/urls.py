from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_view, name='ai-chat'),
    path('characters/', views.characters_view, name='ai-characters'),
    path('health/', views.health_view, name='ai-health'),
]
