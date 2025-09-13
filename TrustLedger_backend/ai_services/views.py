from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import logging

from .gemini_service import gemini_service

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    """
    Handle chatbot chat requests
    """
    try:
        data = request.data
        user_query = data.get('query', '').strip()
        context = data.get('context', {})
        conversation_history = data.get('conversation_history', [])
        
        if not user_query:
            return Response({
                'error': 'Query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add user context
        context.update({
            'user_role': request.user.role,
            'user_id': request.user.id,
            'system_context': 'TrustLedger is a financial transparency platform that helps citizens track government fund allocations, project progress, and budget utilization.'
        })
        
        # Generate response
        response_data = gemini_service.generate_response(
            user_query=user_query,
            context=context,
            conversation_history=conversation_history
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in chat_view: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'response': "I'm sorry, I'm having trouble processing your request right now. Please try again later! 😅",
            'suggestions': [
                "Show me the dashboard",
                "What can you help me with?",
                "Try again"
            ],
            'actions': [],
            'source': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def characters_view(request):
    """
    Get available chatbot characters
    """
    try:
        character_info = gemini_service.get_character_info()
        return Response(character_info, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in characters_view: {str(e)}")
        return Response({
            'error': 'Failed to fetch characters'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_view(request):
    """
    Check if AI services are available
    """
    try:
        is_available = gemini_service.is_available()
        return Response({
            'gemini_available': is_available,
            'status': 'healthy' if is_available else 'fallback_mode'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in health_view: {str(e)}")
        return Response({
            'gemini_available': False,
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
