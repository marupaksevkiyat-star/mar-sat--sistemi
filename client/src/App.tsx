import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Sales from "@/pages/sales";
import SalesReports from "@/pages/sales-reports";
import Invoices from "@/pages/invoices";
import Production from "@/pages/production";
import Shipping from "@/pages/shipping";
import Admin from "@/pages/admin";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const canAccess = (requiredRole: string) => {
    const userRole = user?.role || '';
    
    // Admin her şeye erişebilir
    if (userRole === 'admin' || userRole === 'Admin') return true;
    
    // Specific role checks
    if (requiredRole === 'sales') {
      return userRole === 'sales' || userRole.includes('Satış');
    }
    if (requiredRole === 'production') {
      return userRole === 'production' || userRole.includes('Üretim');
    }
    if (requiredRole === 'shipping') {
      return userRole === 'shipping' || userRole.includes('Sevkiyat');
    }
    if (requiredRole === 'admin') {
      return userRole === 'admin' || userRole === 'Admin';
    }
    
    return false;
  };

  const ProtectedRoute = ({ component: Component, requiredRole }: { component: any, requiredRole?: string }) => {
    if (!requiredRole) return <Component />;
    
    if (!canAccess(requiredRole)) {
      return <NotFound />;
    }
    
    return <Component />;
  };

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/sales">
            <ProtectedRoute component={Sales} requiredRole="sales" />
          </Route>
          <Route path="/production">
            <ProtectedRoute component={Production} requiredRole="production" />
          </Route>
          <Route path="/shipping">
            <ProtectedRoute component={Shipping} requiredRole="shipping" />
          </Route>
          <Route path="/sales-reports">
            <ProtectedRoute component={SalesReports} requiredRole="admin" />
          </Route>
          <Route path="/invoices">
            <ProtectedRoute component={Invoices} requiredRole="admin" />
          </Route>
          <Route path="/admin">
            <ProtectedRoute component={Admin} requiredRole="admin" />
          </Route>
        </>
      )}
      <Route component={NotFound} />
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
