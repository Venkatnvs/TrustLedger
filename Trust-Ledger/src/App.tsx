import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Chatbot, ChatbotButton } from "@/components/Chatbot";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Documents from "@/pages/documents";
import FundFlows from "@/pages/fund-flows";
import Projects from "@/pages/projects";
import Search from "@/pages/search";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppContent() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/analytics">
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        </Route>
        <Route path="/documents">
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        </Route>
        <Route path="/fund-flows">
          <ProtectedRoute>
            <FundFlows />
          </ProtectedRoute>
        </Route>
        <Route path="/projects">
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        </Route>
        <Route path="/search">
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
      </main>
      
      {/* Chatbot */}
      {isAuthenticated && (
        <>
          <ChatbotButton onClick={() => setIsChatbotOpen(true)} />
          <Chatbot 
            isOpen={isChatbotOpen} 
            onClose={() => setIsChatbotOpen(false)} 
          />
        </>
      )}
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="trust-ledger-theme">
      <AuthProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <AppContent />
            </Router>
          </QueryClientProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
