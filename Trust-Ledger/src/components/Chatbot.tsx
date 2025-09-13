import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2, 
  MessageCircle,
  Home,
  FileText,
  DollarSign,
  Building2,
  Search,
  BarChart3,
  Settings,
  HelpCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { coreAPI, fundFlowsAPI, documentsAPI, analyticsAPI, aiAPI } from "@/lib/api";
import { ANIME_CHARACTERS, FALLBACK_AVATAR } from "@/lib/characters";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: ChatAction[];
}

interface ChatAction {
  type: 'navigate' | 'search' | 'info';
  label: string;
  data: any;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(ANIME_CHARACTERS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('bot', selectedCharacter.greeting, [
        "Show me the dashboard",
        "Where did the sports budget go?",
        "How are projects performing?",
        "Show me fund flows"
      ]);
    }
  }, [isOpen, selectedCharacter]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addMessage = (type: 'user' | 'bot', content: string, suggestions?: string[], actions?: ChatAction[]) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      suggestions,
      actions
    };
    setMessages(prev => [...prev, message]);
  };

  const simulateTyping = async (response: string, suggestions?: string[], actions?: ChatAction[]) => {
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    addMessage('bot', response, suggestions, actions);
    setIsTyping(false);
  };

  const processQuery = async (query: string) => {
    try {
      // Get current page context
      const currentPage = window.location.pathname.split('/')[1] || 'dashboard';
      const pageNames: { [key: string]: string } = {
        'dashboard': 'Dashboard',
        'projects': 'Projects',
        'fund-flows': 'Fund Flows',
        'documents': 'Documents',
        'analytics': 'Analytics',
        'search': 'Search',
        'settings': 'Settings'
      };

      // Prepare context
      const context = {
        current_page: pageNames[currentPage] || 'Dashboard',
        system_context: 'TrustLedger is a financial transparency platform that helps citizens track government fund allocations, project progress, and budget utilization.',
        user_role: 'Citizen' // You can get this from auth context
      };

      // Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'bot')
        .slice(-5) // Last 5 messages
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Call backend AI service
      const response = await aiAPI.chat({
        query,
        context,
        conversation_history: conversationHistory
      });

      const aiResponse = response.data;
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Add the response
      addMessage('bot', aiResponse.response, aiResponse.suggestions, aiResponse.actions);
      
    } catch (error) {
      console.error('AI service error:', error);
      
      // Fallback to simple responses
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
        await simulateTyping("Taking you to the dashboard! 📊", [], [
          { type: 'navigate', label: 'Go to Dashboard', data: '/dashboard' }
        ]);
      } else if (lowerQuery.includes('projects')) {
        await simulateTyping("Let me show you the projects page! 🏗️", [], [
          { type: 'navigate', label: 'View Projects', data: '/projects' }
        ]);
      } else if (lowerQuery.includes('budget') || lowerQuery.includes('sports budget')) {
        await simulateTyping("I can help you explore budgets and financial data! Try asking about specific projects or departments. 💰", [
          "Show me all projects",
          "What's the total budget?",
          "Show me fund flows"
        ]);
      } else {
        await simulateTyping(
          "I'm here to help you with TrustLedger! I can assist with budgets, projects, fund flows, and more. What would you like to explore? 🤖",
          [
            "Show me the dashboard",
            "Where did the sports budget go?",
            "How are projects performing?",
            "What can you help me with?"
          ]
        );
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const query = inputValue.trim();
    addMessage('user', query);
    setInputValue("");

    await processQuery(query);
  };

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleAction = (action: ChatAction) => {
    if (action.type === 'navigate') {
      setLocation(action.data);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className="w-full max-w-md h-[600px] flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                <AvatarFallback>
                  <img src={FALLBACK_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{selectedCharacter.name}</CardTitle>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {message.type === 'bot' && (
                        <Avatar className="w-6 h-6 mt-1">
                          <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                          <AvatarFallback>
                            <img src={FALLBACK_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs mr-1 mb-1"
                                onClick={() => handleSuggestion(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="secondary"
                                size="sm"
                                className="h-6 text-xs mr-1 mb-1"
                                onClick={() => handleAction(action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex space-x-2">
                      <Avatar className="w-6 h-6 mt-1">
                        <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                        <AvatarFallback>
                          <img src={FALLBACK_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Floating chatbot button
export function ChatbotButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
      size="lg"
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );
}
