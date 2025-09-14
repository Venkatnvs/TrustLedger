import os
import json
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
import logging

# Google Generative AI - Optional imports
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.schema import HumanMessage, AIMessage, SystemMessage
    from langchain.memory import ConversationBufferWindowMemory
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    HarmCategory = None
    HarmBlockThreshold = None
    ChatGoogleGenerativeAI = None
    HumanMessage = None
    AIMessage = None
    SystemMessage = None
    ConversationBufferWindowMemory = None
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import ConversationChain

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for integrating with Google Gemini AI API using LangChain"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY',"AIzaSyAoBmd8UiGipb9TZ6C4YmDP2EELMGyNeqI")
        self.cache_timeout = 300  # 5 minutes
        self.model_name = "gemini-2.5-flash"
        
        # Initialize Google Generative AI
        if self.is_available() and GEMINI_AVAILABLE:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
            
            # Initialize LangChain
            self.llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                google_api_key=self.api_key,
                temperature=0.7,
                max_output_tokens=1024,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                }
            )
            
            # Initialize conversation memory
            self.memory = ConversationBufferWindowMemory(
                k=5,  # Keep last 5 exchanges
                return_messages=True
            )
            
            # Create conversation chain
            self.conversation_chain = self._create_conversation_chain()
    
    def is_available(self) -> bool:
        """Check if Gemini API is available"""
        return bool(GEMINI_AVAILABLE and self.api_key and self.api_key != 'your_gemini_api_key_here')
    
    def _create_conversation_chain(self):
        """Create LangChain conversation chain"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        return ConversationChain(
            llm=self.llm,
            memory=self.memory,
            prompt=prompt,
            verbose=False
        )
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI assistant"""
        return """You are Luna, a helpful AI assistant for TrustLedger, a financial transparency platform for government fund management.

CAPABILITIES:
- Help users navigate the platform
- Answer questions about budgets, projects, and fund flows
- Provide insights on financial data
- Guide users through different features
- Explain complex financial concepts in simple terms

RESPONSE GUIDELINES:
- Be friendly, helpful, and professional
- Use emojis appropriately to make responses engaging
- Keep responses concise but informative
- If you don't know something, admit it and suggest alternatives
- Always be encouraging and supportive
- Use simple language that anyone can understand
- Provide 2-3 follow-up suggestions at the end of your response
- Suggest navigation actions when relevant

FORMAT YOUR RESPONSE AS:
Response: [Your main response here]

Suggestions:
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]

Actions:
- [Action 1: Navigate to Dashboard]
- [Action 2: View Projects]"""
    
    def generate_response(self, 
                         user_query: str, 
                         context: Dict[str, Any] = None,
                         conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Generate AI response using Gemini API with LangChain
        
        Args:
            user_query: User's question or query
            context: Additional context about the current state
            conversation_history: Previous conversation messages
            
        Returns:
            Dict containing response, suggestions, and actions
        """
        if not self.is_available():
            return self._get_fallback_response(user_query, context)
        
        try:
            # Check cache first
            cache_key = f"gemini_response_{hash(user_query)}"
            cached_response = cache.get(cache_key)
            if cached_response:
                return cached_response
            
            # Add context to the query
            enhanced_query = self._enhance_query_with_context(user_query, context)
            
            # Generate response using LangChain
            response = self.conversation_chain.predict(input=enhanced_query)
            
            # Parse the response
            ai_response = self._parse_langchain_response(response)
            
            # Cache the response
            cache.set(cache_key, ai_response, self.cache_timeout)
            
            return ai_response
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return self._get_fallback_response(user_query, context)
    
    def _enhance_query_with_context(self, user_query: str, context: Dict[str, Any]) -> str:
        """Enhance user query with additional context"""
        if not context:
            return user_query
        
        context_info = []
        
        if context.get('current_page'):
            context_info.append(f"Current page: {context['current_page']}")
        
        if context.get('user_role'):
            context_info.append(f"User role: {context['user_role']}")
        
        if context.get('system_context'):
            context_info.append(f"System context: {context['system_context']}")
        
        if context_info:
            enhanced_query = f"{user_query}\n\nContext: {'; '.join(context_info)}"
        else:
            enhanced_query = user_query
        
        return enhanced_query
    
    def _parse_langchain_response(self, response: str) -> Dict[str, Any]:
        """Parse LangChain response and extract structured data"""
        try:
            # Split response into sections
            sections = response.split('\n\n')
            
            main_response = ""
            suggestions = []
            actions = []
            
            current_section = "response"
            
            for section in sections:
                section = section.strip()
                if not section:
                    continue
                
                if section.startswith("Response:"):
                    main_response = section.replace("Response:", "").strip()
                    current_section = "response"
                elif section.startswith("Suggestions:"):
                    current_section = "suggestions"
                    # Extract suggestions from the section
                    lines = section.split('\n')[1:]  # Skip "Suggestions:" line
                    for line in lines:
                        line = line.strip()
                        if line.startswith('- '):
                            suggestions.append(line[2:].strip())
                elif section.startswith("Actions:"):
                    current_section = "actions"
                    # Extract actions from the section
                    lines = section.split('\n')[1:]  # Skip "Actions:" line
                    for line in lines:
                        line = line.strip()
                        if line.startswith('- '):
                            action_text = line[2:].strip()
                            # Parse action format: "Action: Navigate to Dashboard"
                            if ':' in action_text:
                                action_parts = action_text.split(':', 1)
                                action_type = action_parts[0].strip().lower()
                                action_label = action_parts[1].strip()
                                
                                # Map action types to data
                                action_data = self._map_action_to_data(action_type, action_label)
                                if action_data:
                                    actions.append(action_data)
                else:
                    # Continue current section
                    if current_section == "response" and not main_response:
                        main_response = section
                    elif current_section == "suggestions":
                        if section.startswith('- '):
                            suggestions.append(section[2:].strip())
                    elif current_section == "actions":
                        if ':' in section:
                            action_parts = section.split(':', 1)
                            action_type = action_parts[0].strip().lower()
                            action_label = action_parts[1].strip()
                            action_data = self._map_action_to_data(action_type, action_label)
                            if action_data:
                                actions.append(action_data)
            
            # If no structured response, use the whole response as main response
            if not main_response:
                main_response = response
            
            # Ensure we have suggestions and actions
            if not suggestions:
                suggestions = self._get_default_suggestions()
            if not actions:
                actions = self._get_default_actions()
            
            return {
                'response': main_response,
                'suggestions': suggestions[:3],  # Limit to 3
                'actions': actions[:2],  # Limit to 2
                'source': 'gemini_langchain'
            }
            
        except Exception as e:
            logger.error(f"Error parsing LangChain response: {str(e)}")
            return {
                'response': response,
                'suggestions': self._get_default_suggestions(),
                'actions': self._get_default_actions(),
                'source': 'gemini_langchain_fallback'
            }
    
    def _map_action_to_data(self, action_type: str, action_label: str) -> Optional[Dict[str, str]]:
        """Map action text to structured action data"""
        action_type = action_type.lower()
        
        if 'navigate' in action_type or 'go' in action_type:
            if 'dashboard' in action_label.lower():
                return {'type': 'navigate', 'label': 'Go to Dashboard', 'data': '/dashboard'}
            elif 'project' in action_label.lower():
                return {'type': 'navigate', 'label': 'View Projects', 'data': '/projects'}
            elif 'fund' in action_label.lower() or 'flow' in action_label.lower():
                return {'type': 'navigate', 'label': 'View Fund Flows', 'data': '/fund-flows'}
            elif 'document' in action_label.lower():
                return {'type': 'navigate', 'label': 'View Documents', 'data': '/documents'}
            elif 'analytics' in action_label.lower() or 'report' in action_label.lower():
                return {'type': 'navigate', 'label': 'View Analytics', 'data': '/analytics'}
            elif 'search' in action_label.lower():
                return {'type': 'navigate', 'label': 'Search', 'data': '/search'}
            elif 'setting' in action_label.lower():
                return {'type': 'navigate', 'label': 'Settings', 'data': '/settings'}
        
        return None
    
    def _get_default_suggestions(self) -> List[str]:
        """Get default suggestions"""
        return [
            "Show me the dashboard",
            "Where did the sports budget go?",
            "How are projects performing?"
        ]
    
    def _get_default_actions(self) -> List[Dict[str, str]]:
        """Get default actions"""
        return [
            {'type': 'navigate', 'label': 'Go to Dashboard', 'data': '/dashboard'}
        ]
    
    
    def _get_fallback_response(self, user_query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Get fallback response when Gemini API is not available"""
        user_query_lower = user_query.lower()
        
        # Simple keyword-based responses
        if 'hello' in user_query_lower or 'hi' in user_query_lower:
            response = "Hello! I'm Luna, your TrustLedger assistant! How can I help you today? 🌟"
        elif 'budget' in user_query_lower or 'money' in user_query_lower:
            response = "I can help you explore budgets and financial data! Try asking about specific projects or departments. 💰"
        elif 'project' in user_query_lower:
            response = "Let me show you the projects! You can view all projects, their status, and budget allocations. 🏗️"
        elif 'help' in user_query_lower:
            response = "I'm here to help! I can guide you through the platform, answer questions about budgets and projects, and help you find information. What would you like to know? 😊"
        elif 'thank' in user_query_lower:
            response = "You're welcome! I'm always here to help. Is there anything else you'd like to know? 😊"
        else:
            response = "I'm here to help you with TrustLedger! I can assist with budgets, projects, fund flows, and more. What would you like to explore? 🤖"
        
        return {
            'response': response,
            'suggestions': self._get_default_suggestions(),
            'actions': self._get_default_actions(),
            'source': 'fallback'
        }
    
    def get_character_info(self) -> Dict[str, Any]:
        """Get information about available characters"""
        return {
            'characters': [
                {
                    'name': 'Luna',
                    'personality': 'friendly and helpful',
                    'greeting': "Hi! I'm Luna, your TrustLedger assistant! How can I help you today? 🌟",
                    'color': 'purple'
                },
                {
                    'name': 'Kai', 
                    'personality': 'professional and knowledgeable',
                    'greeting': "Hello! I'm Kai, your financial transparency guide. What would you like to know? 💼",
                    'color': 'blue'
                },
                {
                    'name': 'Maya',
                    'personality': 'enthusiastic and supportive', 
                    'greeting': "Hey there! I'm Maya! Ready to explore your fund flows together? ✨",
                    'color': 'pink'
                }
            ]
        }

# Singleton instance
gemini_service = GeminiService()
