import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<'visits' | 'sales' | 'orders' | null>(null);

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

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Detailed data for modals - Get all visits for admin
  const { data: allVisits } = useQuery({
    queryKey: ["/api/visits"],
    retry: false,
    enabled: activeModal === 'visits',
  });

  const { data: allOrders } = useQuery({
    queryKey: ["/api/orders"],
    retry: false,
    enabled: activeModal === 'sales' || activeModal === 'orders',
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

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-2xl text-destructive"></i>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Yetkisiz Erişim</h2>
            <p className="text-muted-foreground">Bu sayfaya erişim için admin yetkisi gerekiyor.</p>
          </div>
        </main>
      </div>
    );
  }

  const userStats = {
    totalUsers: 48, // Mock data - in real app would come from API
  };

  const customerStats = {
    totalCustomers: customers?.length || 0,
  };

  const productStats = {
    totalProducts: products?.length || 0,
  };

  // Calculate monthly target percentage
  const monthlyTarget = {
    current: dashboardStats?.monthlySales || 0,
    target: 500000, // 500K target
    percentage: dashboardStats?.monthlySales ? Math.round((dashboardStats.monthlySales / 500000) * 100) : 0,
  };

  const satisfaction = {
    score: 4.7,
    progress: 94,
  };

  const deliveryTime = {
    average: "3.2 gün ortalama",
    efficiency: 78,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Yönetim Paneli</h2>
          <p className="text-muted-foreground mt-1">Sistem ayarları ve kullanıcı yönetimi</p>
        </div>

        {/* Dashboard Stats - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => setActiveModal('visits')}
            data-testid="card-daily-visits"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-map-marker-alt text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Günlük Ziyaretler</h3>
              <p className="text-sm text-muted-foreground mb-4">Satış elemanı ziyaret detayları</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground">
                  {dashboardStats?.dailyVisits || 0}
                </span>
                <span className="text-muted-foreground ml-1">bugünkü ziyaret</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => setActiveModal('sales')}
            data-testid="card-monthly-sales"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-lira-sign text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Aylık Satışlar</h3>
              <p className="text-sm text-muted-foreground mb-4">Firmalar bazında satış raporu</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground">
                  ₺{dashboardStats?.monthlySales ? ((dashboardStats.monthlySales as number) / 1000).toFixed(1) : '0'}K
                </span>
                <span className="text-muted-foreground ml-1">bu ay</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => setActiveModal('orders')}
            data-testid="card-recent-orders"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-clipboard-list text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Son Siparişler</h3>
              <p className="text-sm text-muted-foreground mb-4">Sipariş içerikleri ve detayları</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground">
                  {dashboardStats?.activeOrders || 0}
                </span>
                <span className="text-muted-foreground ml-1">aktif sipariş</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-user-management">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Kullanıcı Yönetimi</h3>
              <p className="text-sm text-muted-foreground mb-4">Personel kayıtları ve yetki tanımlamaları</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground" data-testid="text-total-users">
                  {userStats.totalUsers}
                </span>
                <span className="text-muted-foreground ml-1">aktif kullanıcı</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Management */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-customer-management">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-building text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Müşteri Yönetimi</h3>
              <p className="text-sm text-muted-foreground mb-4">Müşteri kayıtları ve iletişim bilgileri</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground" data-testid="text-total-customers">
                  {customerStats.totalCustomers}
                </span>
                <span className="text-muted-foreground ml-1">kayıtlı müşteri</span>
              </div>
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-product-management">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-boxes text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Ürün Yönetimi</h3>
              <p className="text-sm text-muted-foreground mb-4">Ürün katalogu ve fiyat yönetimi</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground" data-testid="text-total-products">
                  {productStats.totalProducts}
                </span>
                <span className="text-muted-foreground ml-1">ürün çeşidi</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Report */}
          <Card>
            <CardHeader>
              <CardTitle>Aylık Performans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Satış Hedefi</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-sales-target">
                      {monthlyTarget.percentage}% (₺{(monthlyTarget.current / 1000).toFixed(0)}K / ₺{(monthlyTarget.target / 1000).toFixed(0)}K)
                    </span>
                  </div>
                  <Progress value={monthlyTarget.percentage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Müşteri Memnuniyeti</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-satisfaction-score">
                      {satisfaction.score}/5.0
                    </span>
                  </div>
                  <Progress value={satisfaction.progress} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Teslimat Süresi</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-delivery-time">
                      {deliveryTime.average}
                    </span>
                  </div>
                  <Progress value={deliveryTime.efficiency} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">E-posta Bildirimleri</p>
                    <p className="text-sm text-muted-foreground">Otomatik bildirimler gönder</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-email-notifications" />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">GPS Takibi</p>
                    <p className="text-sm text-muted-foreground">Saha personeli konum takibi</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-gps-tracking" />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Otomatik Faturalama</p>
                    <p className="text-sm text-muted-foreground">Teslimat sonrası fatura oluştur</p>
                  </div>
                  <Switch data-testid="switch-auto-invoicing" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      {/* Daily Visits Modal */}
      <Dialog open={activeModal === 'visits'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-blue-600"></i>
              Günlük Ziyaretler Detayı
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allVisits && (allVisits as any[]).length > 0 ? (
              (allVisits as any[]).map((visit: any) => (
                <Card key={visit.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {visit.customer?.companyName || 'Bilinmeyen Müşteri'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Satış Elemanı: {visit.salesPerson?.firstName} {visit.salesPerson?.lastName}
                      </p>
                    </div>
                    <Badge variant={
                      visit.outcome === 'sale' ? 'default' : 
                      visit.outcome === 'follow_up' ? 'secondary' : 
                      'destructive'
                    }>
                      {visit.outcome === 'sale' ? 'Satış' : 
                       visit.outcome === 'follow_up' ? 'Takip' : 
                       'İlgi Yok'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <i className="fas fa-calendar-alt mr-2"></i>
                    {new Date(visit.visitDate).toLocaleDateString('tr-TR')} - {new Date(visit.visitDate).toLocaleTimeString('tr-TR')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    Konum: {visit.latitude?.toFixed(4)}, {visit.longitude?.toFixed(4)}
                  </p>
                  {visit.notes && (
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      <i className="fas fa-sticky-note mr-2"></i>
                      {visit.notes}
                    </p>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Henüz ziyaret kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Sales Modal */}
      <Dialog open={activeModal === 'sales'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-lira-sign text-green-600"></i>
              Aylık Satış Raporu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allOrders && (allOrders as any[]).filter((order: any) => order.status === 'delivered').length > 0 ? (
              (allOrders as any[])
                .filter((order: any) => order.status === 'delivered')
                .reduce((acc: any[], order: any) => {
                  const existingCustomer = acc.find(item => item.customerId === order.customerId);
                  if (existingCustomer) {
                    existingCustomer.totalAmount += order.totalAmount;
                    existingCustomer.orderCount += 1;
                  } else {
                    acc.push({
                      customerId: order.customerId,
                      customerName: order.customer?.companyName || 'Bilinmeyen Müşteri',
                      totalAmount: order.totalAmount,
                      orderCount: 1
                    });
                  }
                  return acc;
                }, [])
                .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
                .map((customerSale: any) => (
                  <Card key={customerSale.customerId} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {customerSale.customerName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {customerSale.orderCount} sipariş
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          ₺{customerSale.totalAmount.toLocaleString('tr-TR')}
                        </p>
                        <p className="text-sm text-muted-foreground">Toplam Satış</p>
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Henüz teslim edilen sipariş bulunmuyor.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Orders Modal */}
      <Dialog open={activeModal === 'orders'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-clipboard-list text-purple-600"></i>
              Son Siparişler Detayı
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allOrders && (allOrders as any[]).length > 0 ? (
              (allOrders as any[]).slice(0, 10).map((order: any) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Sipariş #{order.orderNumber}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Müşteri: {order.customer?.companyName || 'Bilinmeyen Müşteri'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Satış Elemanı: {order.salesPerson?.firstName} {order.salesPerson?.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        order.status === 'delivered' ? 'default' : 
                        order.status === 'shipping' ? 'secondary' : 
                        order.status === 'production' ? 'outline' : 
                        'destructive'
                      }>
                        {order.status === 'pending' ? 'Bekliyor' :
                         order.status === 'production' ? 'Üretimde' :
                         order.status === 'production_ready' ? 'Sevkiyata Hazır' :
                         order.status === 'shipping' ? 'Sevkiyatta' :
                         'Teslim Edildi'}
                      </Badge>
                      <p className="text-lg font-bold text-foreground mt-1">
                        ₺{order.totalAmount.toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="border-t pt-3">
                      <h5 className="font-medium text-foreground mb-2">Sipariş İçeriği:</h5>
                      <div className="space-y-1">
                        {order.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.product?.name || 'Bilinmeyen Ürün'} x {item.quantity}
                            </span>
                            <span className="font-medium">
                              ₺{item.totalPrice.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm text-muted-foreground">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      Sipariş Tarihi: {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                    {order.deliveryAddress && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        Teslimat Adresi: {order.deliveryAddress}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Henüz sipariş bulunmuyor.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
