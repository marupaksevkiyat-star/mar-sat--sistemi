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
import InvoiceDetail from "@/pages/invoice-detail";
import CurrentAccount from "@/pages/current-account";
import Production from "@/pages/production";
import Shipping from "@/pages/shipping";
import Admin from "@/pages/admin";
import Orders from "@/pages/orders";
import Customers from "@/pages/customers";
import MailSettings from "@/pages/mail-settings";
import Permissions from "@/pages/permissions";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  const canAccess = (requiredRole: string) => {
    const userRole = (user as any)?.role || '';
    
    console.log(`🔒 ROLE CHECK: userRole="${userRole}", requiredRole="${requiredRole}"`);
    
    // Admin her şeye erişebilir  
    if (userRole === 'admin' || userRole === 'Admin' || userRole.includes('Admin')) {
      console.log(`✅ ADMIN ACCESS GRANTED`);
      return true;
    }
    
    // Unified role mapping - hem İngilizce hem Türkçe rolleri destekler
    const roleMap = {
      sales: ['sales', 'sales_staff', 'Satış', 'Satış Personeli'],
      production: ['production', 'production_staff', 'Üretim', 'Üretim Personeli'],
      shipping: ['shipping', 'shipping_staff', 'Sevkiyat', 'Sevkiyat Personeli'],
      admin: ['admin', 'Admin'],
      accounting: ['accounting', 'accounting_staff', 'Muhasebe', 'Muhasebe Personeli']
    };
    
    // Check if user role matches any of the allowed roles for the required permission
    const allowedRoles = roleMap[requiredRole as keyof typeof roleMap] || [];
    
    const hasAccess = allowedRoles.some(role => 
      userRole === role || userRole.includes(role)
    );
    
    return hasAccess;
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
      {isLoading ? (
        <Route path="*">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Yükleniyor...</p>
            </div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="*" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/orders" component={Orders} />
          <Route path="/customers" component={Customers} />
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
            <ProtectedRoute component={Invoices} requiredRole="accounting" />
          </Route>
          <Route path="/invoices/:id">
            {(params) => (
              <ProtectedRoute 
                component={() => <InvoiceDetail invoiceId={params.id} />} 
                requiredRole="accounting" 
              />
            )}
          </Route>
          <Route path="/current-account">
            <ProtectedRoute component={CurrentAccount} requiredRole="accounting" />
          </Route>
          <Route path="/mail-settings">
            <ProtectedRoute component={MailSettings} requiredRole="admin" />
          </Route>
          <Route path="/admin">
            <ProtectedRoute component={Admin} requiredRole="admin" />
          </Route>
          <Route path="/permissions">
            <ProtectedRoute component={Permissions} requiredRole="admin" />
          </Route>
          <Route component={NotFound} />
        </>
      )}
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
