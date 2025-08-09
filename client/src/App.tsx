import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-new-auth";
import { SyncProvider } from "@/contexts/sync-context";

import { NewLoginPage } from "@/pages/new-login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import InitializeDatabasePage from "@/pages/init-db";

function AuthenticatedApp() {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated) {
    return <NewLoginPage />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/init-db" component={InitializeDatabasePage} />
      <Route>
        <AuthProvider>
          <SyncProvider>
            <AuthenticatedApp />
          </SyncProvider>
        </AuthProvider>
      </Route>
    </Switch>
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
