import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

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
    </div>
  );
}
