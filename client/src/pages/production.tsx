import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import ProductionTabs from "@/components/production/production-tabs";
import OrderCard from "@/components/production/order-card";
import { useEffect } from "react";

export default function Production() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: pendingOrders, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/orders?status=pending"],
    retry: false,
  });

  const { data: activeOrders, isLoading: activeLoading } = useQuery({
    queryKey: ["/api/orders?status=production"],
    retry: false,
  });

  const { data: completedOrders, isLoading: completedLoading } = useQuery({
    queryKey: ["/api/orders?status=production_ready"],
    retry: false,
  });

  const startProductionMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      return await apiRequest('PUT', `/api/orders/${orderId}/status`, { status: "production" });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim başlatıldı",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "Üretim başlatılırken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const updateProductionMutation = useMutation({
    mutationFn: async ({ orderId, items, notes }: { orderId: string; items: any[]; notes?: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/items`, items);
      if (notes) {
        await apiRequest("PUT", `/api/orders/${orderId}/status`, {
          status: "production",
          productionNotes: notes,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "Üretim güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const completeProductionMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      return await apiRequest('PUT', `/api/orders/${orderId}/status`, { status: "production_ready" });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Üretim tamamlandı, sevkiyata hazır",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "Üretim tamamlanırken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleStartProduction = (orderId: string) => {
    startProductionMutation.mutate({ orderId });
  };

  const handleUpdateProduction = (orderId: string, items: any[], notes?: string) => {
    updateProductionMutation.mutate({ orderId, items, notes });
  };

  const handleCompleteProduction = (orderId: string) => {
    completeProductionMutation.mutate({ orderId });
  };

  const getOrdersForTab = () => {
    switch (activeTab) {
      case "pending":
        return { orders: pendingOrders || [], isLoading: pendingLoading };
      case "active":
        return { orders: activeOrders || [], isLoading: activeLoading };
      case "completed":
        return { orders: completedOrders || [], isLoading: completedLoading };
      default:
        return { orders: [], isLoading: false };
    }
  };

  const { orders, isLoading: ordersLoading } = getOrdersForTab();

  const getCounts = () => ({
    pending: pendingOrders?.length || 0,
    active: activeOrders?.length || 0,
    completed: completedOrders?.length || 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Üretim Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Sipariş takibi ve üretim süreci yönetimi</p>
        </div>

        <ProductionTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={getCounts()}
        />

        <div className="mt-6">
          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-clipboard-list text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">Bu kategoride sipariş bulunmamaktadır</p>
            </div>
          ) : activeTab === "active" ? (
            <div className="space-y-6">
              {orders.map((order: any) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  mode="edit"
                  onStartProduction={handleStartProduction}
                  onUpdateProduction={handleUpdateProduction}
                  onCompleteProduction={handleCompleteProduction}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map((order: any) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  mode={activeTab === "pending" ? "pending" : "view"}
                  onStartProduction={handleStartProduction}
                  onUpdateProduction={handleUpdateProduction}
                  onCompleteProduction={handleCompleteProduction}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
