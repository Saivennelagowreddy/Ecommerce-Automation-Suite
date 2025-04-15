import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import Inventory from "@/pages/Inventory";
import Clients from "@/pages/Clients";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/AuthPage";
import ProfilePage from "@/pages/ProfilePage";
import LogoutPage from "@/pages/LogoutPage";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import { AuthProvider } from "@/hooks/useAuth";

function Router() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth page doesn't include the dashboard layout
  if (location === "/auth") {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
      </Switch>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} currentPath={location} />
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          <Switch>
            <ProtectedRoute path="/">
              <Dashboard />
            </ProtectedRoute>
            <ProtectedRoute path="/dashboard">
              <Dashboard />
            </ProtectedRoute>
            <ProtectedRoute path="/orders">
              <Orders />
            </ProtectedRoute>
            <ProtectedRoute path="/orders/:id">
              <OrderDetails />
            </ProtectedRoute>
            <ProtectedRoute path="/inventory">
              <Inventory />
            </ProtectedRoute>
            <ProtectedRoute path="/clients">
              <Clients />
            </ProtectedRoute>
            <ProtectedRoute path="/settings">
              <Settings />
            </ProtectedRoute>
            <ProtectedRoute path="/profile">
              <ProfilePage />
            </ProtectedRoute>
            <Route path="/logout" component={LogoutPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav currentPath={location} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
