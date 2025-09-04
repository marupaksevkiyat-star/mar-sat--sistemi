import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import DeliveryInterface from "@/components/shipping/delivery-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function Shipping() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeDelivery, setActiveDelivery] = useState<any>(null);

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

  const { data: readyOrders, isLoading: readyLoading } = useQuery({
    queryKey: ["/api/orders", "status", "production_ready"],
    queryFn: () => fetch("/api/orders?status=production_ready", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  const { data: shippingOrders, isLoading: shippingLoading } = useQuery({
    queryKey: ["/api/orders", "status", "shipping"],
    queryFn: () => fetch("/api/orders?status=shipping", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  const { data: deliveredOrders, isLoading: deliveredLoading } = useQuery({
    queryKey: ["/api/orders", "status", "delivered"],
    queryFn: () => fetch("/api/orders?status=delivered", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  const createDeliveryNoteMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      return await apiRequest('PUT', `/api/orders/${orderId}/status`, { status: "shipping" });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Başarılı",
        description: "İrsaliye oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "production_ready"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "shipping"] });
      // Dashboard verilerini de güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      
      // Set as active delivery
      const order = readyOrders?.find((o: any) => o.id === variables.orderId);
      if (order) {
        setActiveDelivery(order);
      }
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
        description: "İrsaliye oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, recipient, signature }: { orderId: string; recipient: string; signature?: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/status`, {
        status: "delivered",
        deliveryRecipient: recipient,
        deliverySignature: signature,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Teslimat tamamlandı",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "shipping"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "delivered"] });
      // Dashboard verilerini de güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      setActiveDelivery(null);
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
        description: "Teslimat tamamlanırken bir hata oluştu",
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

  const handleCreateDeliveryNote = (orderId: string) => {
    createDeliveryNoteMutation.mutate({ orderId });
  };

  const handleCompleteDelivery = (recipient: string, signature?: string) => {
    if (activeDelivery) {
      completeDeliveryMutation.mutate({
        orderId: activeDelivery.id,
        recipient,
        signature,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Bekliyor", className: "status-pending" },
      production: { label: "Üretimde", className: "status-production" },
      production_ready: { label: "Hazır", className: "status-ready" },
      shipping: { label: "Sevkiyatta", className: "status-shipping" },
      delivered: { label: "Teslim Edildi", className: "status-delivered" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "" };
    
    return (
      <Badge className={config.className} data-testid={`status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Sevkiyat Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Teslimat ve sevkiyat süreçleri</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready for Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Sevkiyata Hazır Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {readyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !readyOrders || readyOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-truck text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Sevkiyata hazır sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readyOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`order-ready-${order.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">{order.customer.companyName}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        <p>
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {order.deliveryAddress || order.customer.address}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleCreateDeliveryNote(order.id)}
                          className="flex-1"
                          size="sm"
                          data-testid={`button-create-delivery-${order.id}`}
                        >
                          <i className="fas fa-file-alt mr-2"></i>
                          İrsaliye Oluştur
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          data-testid={`button-view-details-${order.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Delivery Interface */}
          <DeliveryInterface
            activeDelivery={activeDelivery}
            onCompleteDelivery={handleCompleteDelivery}
          />
        </div>

        {/* Delivery History */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Teslim Edilenler</CardTitle>
            </CardHeader>
            <CardContent>
              {deliveredLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !deliveredOrders || deliveredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-check-circle text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Henüz teslim edilen sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Sipariş No</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Müşteri</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Teslimat Tarihi</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Teslim Alan</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveredOrders.map((order: any) => (
                        <tr key={order.id} className="border-b border-border hover:bg-accent/30">
                          <td className="py-3 px-4 text-sm font-medium text-foreground">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.customer.companyName}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.deliveryRecipient || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
