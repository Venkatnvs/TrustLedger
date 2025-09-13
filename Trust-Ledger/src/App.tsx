import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/Header";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Documents from "@/pages/documents";
import FundFlows from "@/pages/fund-flows";
import Projects from "@/pages/projects";
import Search from "@/pages/search";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/documents" component={Documents} />
            <Route path="/fund-flows" component={FundFlows} />
            <Route path="/projects" component={Projects} />
            <Route path="/search" component={Search} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route component={NotFound} />
          </main>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App
