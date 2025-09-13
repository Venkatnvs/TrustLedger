// This file is deprecated - AI functionality is now handled by the backend
// See: TrustLedger_backend/ai_services/gemini_service.py

export interface GeminiResponse {
  text: string;
  actions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}

// Fallback function for when backend is not available
export async function getGeminiResponse(query: string, location: string): Promise<GeminiResponse> {
  return {
    text: "I'm here to help you with TrustLedger! I can assist with budgets, projects, fund flows, and more. What would you like to explore? 🤖",
    actions: [
      { label: "Show me the dashboard", action: "navigate", payload: "/dashboard" },
      { label: "Where did the sports budget go?", action: "query", payload: "Where did the sports budget go?" },
      { label: "How are projects performing?", action: "query", payload: "How are projects performing?" }
    ]
  };
}