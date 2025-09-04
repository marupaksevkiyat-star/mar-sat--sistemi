import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderWithDetails } from "@shared/schema";
import InvoiceModal from "@/components/orders/invoice-modal";
import { FileText, Trash2 } from "lucide-react";

type OrderStatus = "pending" | "production" | "production_ready" | "shipping" | "delivered" | "cancelled";

interface StatusTabConfig {
  key: OrderStatus | "all";
  label: string;
  statusFilter?: OrderStatus;
  icon: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

const statusTabs: StatusTabConfig[] = [
  { key: "all", label: "Tümü", icon: "fas fa-list", badgeVariant: "outline" },
  { key: "pending", label: "Bekleyen", statusFilter: "pending", icon: "fas fa-clock", badgeVariant: "secondary" },
  { key: "production", label: "Üretimde", statusFilter: "production", icon: "fas fa-cogs", badgeVariant: "default" },
  { key: "shipping", label: "Sevkiyatta", statusFilter: "shipping", icon: "fas fa-truck", badgeVariant: "default" },
  { key: "delivered", label: "Tamamlandı", statusFilter: "delivered", icon: "fas fa-check-circle", badgeVariant: "default" },
  { key: "cancelled", label: "İptal Oldu", statusFilter: "cancelled", icon: "fas fa-times-circle", badgeVariant: "destructive" },
];

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Bekleyen", variant: "secondary" },
    production: { label: "Üretimde", variant: "default" },
    production_ready: { label: "Üretim Hazır", variant: "default" },
    shipping: { label: "Sevkiyatta", variant: "default" },
    delivered: { label: "Teslim Edildi", variant: "default" },
    cancelled: { label: "İptal Edildi", variant: "destructive" },
  };
  
  const config = statusMap[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Mail gönderme component'i
function SendDeliveryEmailButton({ orderId, customerEmail }: { orderId: string; customerEmail: string }) {
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/send-delivery-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Mail Gönderildi",
        description: `Teslim bildirimi ${customerEmail} adresine gönderildi`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Mail Gönderilemedi", 
        description: error.message || "Mail gönderirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => sendEmailMutation.mutate()}
      disabled={sendEmailMutation.isPending}
      className="w-full bg-green-600 hover:bg-green-700"
      data-testid={`button-send-email-${orderId}`}
    >
      <i className={`fas ${sendEmailMutation.isPending ? 'fa-spinner fa-spin' : 'fa-envelope'} mr-2`}></i>
      {sendEmailMutation.isPending ? 'Gönderiliyor...' : 'Teslim Maili Gönder'}
    </Button>
  );
}

const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(numAmount);
};

const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return 'Tarih belirtilmemiş';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Fetch all orders
  const { data: allOrders = [], isLoading, error, refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  // Durum değiştirme
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Durum güncellenemedi');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Sipariş durumu güncellendi" });
      refetch();
    },
    onError: () => {
      toast({ title: "Hata", description: "Durum güncellenemedi", variant: "destructive" });
    }
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: string) => {
    // TODO: Sipariş silme işlemi
    toast({ title: "Bilgi", description: "Sipariş silme özelliği yakında eklenecek" });
  };

  // Filter orders by active tab
  const filteredOrders = (allOrders as OrderWithDetails[]).filter((order: OrderWithDetails) => {
    if (activeTab === "all") return true;
    
    const activeConfig = statusTabs.find(tab => tab.key === activeTab);
    if (!activeConfig?.statusFilter) return true;
    
    return order.status === activeConfig.statusFilter;
  });

  // Count orders for each status
  const getOrderCount = (statusFilter?: OrderStatus) => {
    if (!statusFilter) return (allOrders as OrderWithDetails[]).length;
    return (allOrders as OrderWithDetails[]).filter((order: OrderWithDetails) => order.status === statusFilter).length;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Giriş Gerekli</h2>
            <p className="text-muted-foreground">Siparişleri görüntülemek için giriş yapmanız gerekiyor.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-destructive"></i>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Hata Oluştu</h2>
            <p className="text-muted-foreground">Siparişler yüklenirken bir hata oluştu.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Siparişler</h1>
          <p className="text-muted-foreground">
            Sipariş takibi ve durum yönetimi {user?.firstName && user?.lastName ? ` - ${user.firstName} ${user.lastName}` : ''}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6" data-testid="orders-tabs">
            {statusTabs.map((tab) => (
              <TabsTrigger 
                key={tab.key} 
                value={tab.key}
                className="relative"
                data-testid={`tab-${tab.key}`}
              >
                <div className="flex items-center gap-2">
                  <i className={`${tab.icon} text-sm`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge variant={tab.badgeVariant} className="ml-1">
                    {getOrderCount(tab.statusFilter)}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {statusTabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Siparişler yükleniyor...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className={`${tab.icon} text-2xl text-muted-foreground`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {tab.key === "all" ? "Henüz sipariş yok" : `${tab.label} sipariş bulunamadı`}
                  </h3>
                  <p className="text-muted-foreground">
                    {tab.key === "all" 
                      ? "İlk siparişinizi oluşturmak için Satış bölümüne gidin."
                      : `${tab.label} durumunda sipariş bulunmuyor.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredOrders.map((order: OrderWithDetails) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">
                            Sipariş #{order.orderNumber}
                          </CardTitle>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Müşteri</h4>
                            <p className="font-semibold" data-testid={`order-customer-${order.id}`}>
                              {order.customer?.companyName || 'Bilinmiyor'}
                            </p>
                            {order.customer?.contactPerson && (
                              <p className="text-sm text-muted-foreground">
                                {order.customer.contactPerson}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Satış Temsilcisi</h4>
                            <p className="font-semibold">
                              {order.salesPerson?.firstName} {order.salesPerson?.lastName}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Toplam Tutar</h4>
                            <p className="font-bold text-lg" data-testid={`order-total-${order.id}`}>
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Ürün Sayısı</h4>
                            <p className="font-semibold">
                              {order.items?.length || 0} ürün
                            </p>
                          </div>
                        </div>
                        
                        {order.items && order.items.length > 0 && (
                          <div className="mt-4 pt-3 border-t">
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Ürünler</h4>
                            <div className="space-y-1">
                              {order.items.slice(0, 3).map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantity}x {item.product?.name || 'Ürün'}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(item.totalPrice)}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.items.length - 3} ürün daha...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {order.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Notlar</h4>
                            <p className="text-sm">{order.notes}</p>
                          </div>
                        )}
                        
                        {/* Aksiyon Butonları */}
                        <div className="mt-4 pt-3 border-t space-y-2">
                          {/* Durum Değiştirme */}
                          <div className="flex gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  Beklemede
                                </SelectItem>
                                <SelectItem value="production">
                                  Üretimde
                                </SelectItem>
                                <SelectItem value="production_ready">
                                  Üretim Tamamlandı
                                </SelectItem>
                                <SelectItem value="shipping">
                                  Kargoda
                                </SelectItem>
                                <SelectItem value="delivered">
                                  Teslim Edildi
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  İptal Edildi
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {order.status === 'cancelled' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="w-full"
                            data-testid={`button-invoice-${order.id}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            İrsaliye Görüntüle / Yazdır
                          </Button>
                          
                          {/* Mail Gönderme Butonu - Sadece teslim edilmiş siparişler için */}
                          {order.status === 'delivered' && order.customer.email && (
                            <SendDeliveryEmailButton orderId={order.id} customerEmail={order.customer.email} />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      
      {/* İrsaliye Modal */}
      {selectedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
}