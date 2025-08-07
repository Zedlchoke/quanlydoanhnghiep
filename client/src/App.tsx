import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/login-form";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <LoginForm
        onLogin={async (credentials) => {
          const success = await login(credentials);
          if (success) {
            setShowLogin(false);
          }
          return success;
        }}
      />
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard onShowLogin={() => setShowLogin(true)} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
