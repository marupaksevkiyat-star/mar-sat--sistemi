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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState<'visits' | 'sales' | 'orders' | 'users' | 'add-user' | 'edit-user' | 'customers' | 'products' | 'add-product' | 'add-customer' | 'edit-product' | 'edit-customer' | null>(null);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: ''
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    code: '',
    price: '',
    category: ''
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    segment: 'Standart'
  });

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

  // Get all users for user management modal
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
    enabled: activeModal === 'users',
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest('/api/users', 'POST', userData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yeni kullanıcı eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setActiveModal('users');
      setNewUser({ firstName: '', lastName: '', email: '', role: '', password: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Kullanıcı eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log("Updating user:", userData);
      return await apiRequest(`/api/users/${userData.id}`, 'PUT', userData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kullanıcı güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setActiveModal('users');
      setEditingUser(null);
    },
    onError: (error: Error) => {
      console.error("Edit user error:", error);
      toast({
        title: "Hata",
        description: `Kullanıcı güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Kullanıcı silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string, status: string }) => {
      return await apiRequest(`/api/users/${userId}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kullanıcı durumu güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Kullanıcı durumu güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("/api/products", "POST", productData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Yeni ürün eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setActiveModal('products');
      setNewProduct({ name: '', description: '', code: '', price: '', category: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Ürün eklenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest(`/api/products/${productData.id}`, "PUT", productData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ürün güncellendi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setActiveModal('products');
      setEditingProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Ürün güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest(`/api/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ürün silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu",
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

  // Check if user has admin role
  if (user?.role !== 'admin' && user?.role !== 'Admin') {
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
    totalCustomers: (customers as any[])?.length || 0,
  };

  const productStats = {
    totalProducts: (products as any[])?.length || 0,
  };

  // Calculate monthly target percentage
  const monthlyTarget = {
    current: (dashboardStats as any)?.monthlySales || 0,
    target: 500000, // 500K target
    percentage: (dashboardStats as any)?.monthlySales ? Math.round(((dashboardStats as any).monthlySales / 500000) * 100) : 0,
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Yönetim Paneli</h2>
            <p className="text-muted-foreground mt-1">Sistem ayarları ve kullanıcı yönetimi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Hoş geldiniz, {(user as any)?.firstName} {(user as any)?.lastName}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  await apiRequest('/api/logout', 'POST');
                  window.location.href = '/';
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Çıkış Yap
            </Button>
          </div>
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
                  {(dashboardStats as any)?.dailyVisits || 0}
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
                  ₺{(dashboardStats as any)?.monthlySales ? (((dashboardStats as any).monthlySales as number) / 1000).toFixed(1) : '0'}K
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
                  {(dashboardStats as any)?.activeOrders || 0}
                </span>
                <span className="text-muted-foreground ml-1">aktif sipariş</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => setActiveModal('users')}
            data-testid="card-user-management"
          >
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

          {/* Mail Settings */}
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => window.location.href = '/mail-settings'}
            data-testid="card-mail-settings"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-envelope-open-text text-orange-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Mail Ayarları</h3>
              <p className="text-sm text-muted-foreground mb-4">E-posta yapılandırmaları ve bildirim ayarları</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground">
                  Yapılandır
                </span>
                <i className="fas fa-arrow-right text-muted-foreground ml-2"></i>
              </div>
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => setActiveModal('products')}
            data-testid="card-product-management"
          >
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

          {/* Permissions Management */}
          <Card 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105" 
            onClick={() => window.location.href = '/permissions'}
            data-testid="card-permissions"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-user-shield text-indigo-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Yetki Yönetimi</h3>
              <p className="text-sm text-muted-foreground mb-4">Kullanıcı rolleri ve sayfa erişim yetkileri</p>
              <div className="flex items-center text-sm">
                <span className="font-medium text-foreground">
                  Yönet
                </span>
                <i className="fas fa-arrow-right text-muted-foreground ml-2"></i>
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
                        {visit.customer?.companyName || visit.customer?.name || 'Bilinmeyen Müşteri'}
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
                    Konum: {visit.latitude ? Number(visit.latitude).toFixed(4) : 'N/A'}, {visit.longitude ? Number(visit.longitude).toFixed(4) : 'N/A'}
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
                    existingCustomer.totalAmount += parseFloat(order.totalAmount || '0');
                    existingCustomer.orderCount += 1;
                  } else {
                    acc.push({
                      customerId: order.customerId,
                      customerName: order.customer?.companyName || 'Bilinmeyen Müşteri',
                      totalAmount: parseFloat(order.totalAmount || '0'),
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
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(customerSale.totalAmount)}
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
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(order.totalAmount || '0'))}
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
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(parseFloat(item.totalPrice || '0'))}
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

      {/* User Management Modal */}
      <Dialog open={activeModal === 'users'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-users text-blue-600"></i>
              Kullanıcı Yönetimi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allUsers && (allUsers as any[]).length > 0 ? (
              (allUsers as any[]).map((user: any) => (
                <Card key={user.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-blue-600 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        user.role === 'Admin' ? 'default' : 
                        user.role.includes('Müdürü') ? 'secondary' : 
                        'outline'
                      }>
                        {user.role}
                      </Badge>
                      <div className="mt-2">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setActiveModal('edit-user');
                        }}
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Düzenle
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                      >
                        <i className="fas fa-trash mr-2"></i>
                        Sil
                      </Button>
                      {user.status === 'active' ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'inactive' })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          <i className="fas fa-ban mr-2"></i>
                          Devre Dışı Bırak
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: 'active' })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          <i className="fas fa-check mr-2"></i>
                          Aktifleştir
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                onClick={() => setActiveModal('add-user')}
              >
                <i className="fas fa-plus mr-2"></i>
                Yeni Kullanıcı Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={activeModal === 'add-user'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-user-plus text-blue-600"></i>
              Yeni Kullanıcı Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Ad</Label>
              <Input
                id="firstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                placeholder="Kullanıcının adı"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Soyad</Label>
              <Input
                id="lastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                placeholder="Kullanıcının soyadı"
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="kullanici@company.com"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı rolü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Satış Müdürü">Satış Müdürü</SelectItem>
                  <SelectItem value="Satış Personeli">Satış Personeli</SelectItem>
                  <SelectItem value="Üretim Müdürü">Üretim Müdürü</SelectItem>
                  <SelectItem value="Üretim Personeli">Üretim Personeli</SelectItem>
                  <SelectItem value="Muhasebe Müdürü">Muhasebe Müdürü</SelectItem>
                  <SelectItem value="Muhasebe Personeli">Muhasebe Personeli</SelectItem>
                  <SelectItem value="Sevkiyat Müdürü">Sevkiyat Müdürü</SelectItem>
                  <SelectItem value="Sevkiyat Personeli">Sevkiyat Personeli</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Kullanıcı şifresi"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveModal('users')}
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={() => addUserMutation.mutate(newUser)}
                disabled={addUserMutation.isPending || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role || !newUser.password}
                className="flex-1"
              >
                {addUserMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={activeModal === 'edit-user'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-user-edit text-blue-600"></i>
              Kullanıcı Düzenle
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFirstName">Ad</Label>
                <Input
                  id="editFirstName"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  placeholder="Kullanıcının adı"
                />
              </div>
              
              <div>
                <Label htmlFor="editLastName">Soyad</Label>
                <Input
                  id="editLastName"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  placeholder="Kullanıcının soyadı"
                />
              </div>
              
              <div>
                <Label htmlFor="editEmail">E-posta</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  placeholder="kullanici@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="editRole">Rol</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kullanıcı rolü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satış Müdürü">Satış Müdürü</SelectItem>
                    <SelectItem value="Satış Personeli">Satış Personeli</SelectItem>
                    <SelectItem value="Üretim Müdürü">Üretim Müdürü</SelectItem>
                    <SelectItem value="Üretim Personeli">Üretim Personeli</SelectItem>
                    <SelectItem value="Muhasebe Müdürü">Muhasebe Müdürü</SelectItem>
                    <SelectItem value="Muhasebe Personeli">Muhasebe Personeli</SelectItem>
                    <SelectItem value="Sevkiyat Müdürü">Sevkiyat Müdürü</SelectItem>
                    <SelectItem value="Sevkiyat Personeli">Sevkiyat Personeli</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editPassword">Yeni Şifre (İsteğe bağlı)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder="Boş bırakılırsa şifre değişmez"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveModal('users')}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={() => editUserMutation.mutate(editingUser)}
                  disabled={editUserMutation.isPending || !editingUser.firstName || !editingUser.lastName || !editingUser.email || !editingUser.role}
                  className="flex-1"
                >
                  {editUserMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Güncelle
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Management Modal */}
      <Dialog open={activeModal === 'customers'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-building text-green-600"></i>
              Müşteri Yönetimi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Müşteri Listesi</h3>
              <Button onClick={() => setActiveModal('add-customer')}>
                <i className="fas fa-plus mr-2"></i>
                Yeni Müşteri Ekle
              </Button>
            </div>
            
            {customers && (customers as any[]).length > 0 ? (
              <div className="space-y-4">
                {(customers as any[]).map((customer: any) => (
                  <Card key={customer.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-building text-green-600 text-lg"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {customer.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {customer.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tel: {customer.phone} | Email: {customer.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status === 'active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <div className="mt-2">
                          <Badge variant="outline">
                            {customer.segment || 'Standart'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setActiveModal('edit-customer');
                          }}
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            alert(`Müşteri Detayları:\n\nAd: ${customer.name}\nAdres: ${customer.address}\nTelefon: ${customer.phone}\nE-posta: ${customer.email}\nSegment: ${customer.segment || 'Standart'}\nDurum: ${customer.status === 'active' ? 'Aktif' : 'Pasif'}`);
                          }}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          Detaylar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (customer.latitude && customer.longitude) {
                              const mapUrl = `https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`;
                              window.open(mapUrl, '_blank');
                            } else {
                              alert('Bu müşteri için konum bilgisi bulunamadı.');
                            }
                          }}
                        >
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          Konum
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-building text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Müşteri bulunamadı.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Management Modal */}
      <Dialog open={activeModal === 'products'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-boxes text-purple-600"></i>
              Ürün Yönetimi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Ürün Listesi</h3>
              <Button onClick={() => setActiveModal('add-product')}>
                <i className="fas fa-plus mr-2"></i>
                Yeni Ürün Ekle
              </Button>
            </div>
            
            {products && (products as any[]).length > 0 ? (
              <div className="space-y-4">
                {(products as any[]).map((product: any) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-box text-purple-600 text-lg"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kod: {product.code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          ₺{product.price?.toLocaleString() || '0'}
                        </div>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status === 'active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingProduct(product);
                              setActiveModal('edit-product');
                            }}
                          >
                            <i className="fas fa-edit mr-2"></i>
                            Düzenle
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              alert(`Ürün Detayları:\n\nAd: ${product.name}\nAçıklama: ${product.description}\nKod: ${product.code}\nFiyat: ₺${product.price?.toLocaleString()}\nKategori: ${product.category || 'Genel'}\nDurum: ${product.status === 'active' ? 'Aktif' : 'Pasif'}`);
                            }}
                          >
                            <i className="fas fa-eye mr-2"></i>
                            Detaylar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              alert(`${product.name} için satış raporu: Bu özellik yakında eklenecek!`);
                            }}
                          >
                            <i className="fas fa-chart-line mr-2"></i>
                            Satış
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Kategori: {product.category || 'Genel'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-boxes text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Ürün bulunamadı.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={activeModal === 'add-product'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-plus text-purple-600"></i>
              Yeni Ürün Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">Ürün Adı</Label>
              <Input
                id="productName"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Ürün adı"
              />
            </div>
            
            <div>
              <Label htmlFor="productDescription">Açıklama</Label>
              <Input
                id="productDescription"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Ürün açıklaması"
              />
            </div>
            
            <div>
              <Label htmlFor="productCode">Ürün Kodu</Label>
              <Input
                id="productCode"
                value={newProduct.code}
                onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                placeholder="PR001"
              />
            </div>
            
            <div>
              <Label htmlFor="productPrice">Fiyat (₺)</Label>
              <Input
                id="productPrice"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="productCategory">Kategori</Label>
              <Input
                id="productCategory"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                placeholder="Genel"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveModal('products')}
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={() => {
                  addProductMutation.mutate({
                    name: newProduct.name,
                    description: newProduct.description,
                    code: newProduct.code,
                    price: newProduct.price || '0',
                    category: newProduct.category || 'Genel',
                  });
                }}
                disabled={!newProduct.name || !newProduct.code || addProductMutation.isPending}
                className="flex-1"
              >
                <i className="fas fa-save mr-2"></i>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={activeModal === 'add-customer'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-plus text-green-600"></i>
              Yeni Müşteri Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Müşteri Adı</Label>
              <Input
                id="customerName"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="Firma/kişi adı"
              />
            </div>
            
            <div>
              <Label htmlFor="customerAddress">Adres</Label>
              <Input
                id="customerAddress"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                placeholder="Tam adres"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Telefon</Label>
              <Input
                id="customerPhone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="0532 123 45 67"
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">E-posta</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="email@domain.com"
              />
            </div>
            
            <div>
              <Label htmlFor="customerSegment">Müşteri Segmenti</Label>
              <Input
                id="customerSegment"
                value={newCustomer.segment}
                onChange={(e) => setNewCustomer({...newCustomer, segment: e.target.value})}
                placeholder="Standart, Premium, VIP"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveModal('customers')}
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Başarılı",
                    description: "Yeni müşteri eklendi",
                  });
                  setActiveModal('customers');
                  setNewCustomer({ name: '', address: '', phone: '', email: '', segment: 'Standart' });
                }}
                disabled={!newCustomer.name || !newCustomer.phone}
                className="flex-1"
              >
                <i className="fas fa-save mr-2"></i>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={activeModal === 'edit-product'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-edit text-purple-600"></i>
              Ürün Düzenle
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editProductName">Ürün Adı</Label>
                <Input
                  id="editProductName"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  placeholder="Ürün adı"
                />
              </div>
              
              <div>
                <Label htmlFor="editProductDescription">Açıklama</Label>
                <Input
                  id="editProductDescription"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  placeholder="Ürün açıklaması"
                />
              </div>
              
              <div>
                <Label htmlFor="editProductCode">Ürün Kodu</Label>
                <Input
                  id="editProductCode"
                  value={editingProduct.code}
                  onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                  placeholder="PR001"
                />
              </div>
              
              <div>
                <Label htmlFor="editProductPrice">Fiyat (₺)</Label>
                <Input
                  id="editProductPrice"
                  type="number"
                  value={editingProduct.price || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="editProductCategory">Kategori</Label>
                <Input
                  id="editProductCategory"
                  value={editingProduct.category || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  placeholder="Genel"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveModal('products')}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={() => {
                    editProductMutation.mutate({
                      id: editingProduct.id,
                      name: editingProduct.name,
                      description: editingProduct.description,
                      code: editingProduct.code,
                      price: editingProduct.price?.toString() || '0',
                      category: editingProduct.category || 'Genel',
                    });
                  }}
                  disabled={!editingProduct.name || !editingProduct.code || editProductMutation.isPending}
                  className="flex-1"
                >
                  <i className="fas fa-save mr-2"></i>
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={activeModal === 'edit-customer'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-edit text-green-600"></i>
              Müşteri Düzenle
            </DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCustomerName">Müşteri Adı</Label>
                <Input
                  id="editCustomerName"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  placeholder="Firma/kişi adı"
                />
              </div>
              
              <div>
                <Label htmlFor="editCustomerAddress">Adres</Label>
                <Input
                  id="editCustomerAddress"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                  placeholder="Tam adres"
                />
              </div>
              
              <div>
                <Label htmlFor="editCustomerPhone">Telefon</Label>
                <Input
                  id="editCustomerPhone"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  placeholder="0532 123 45 67"
                />
              </div>
              
              <div>
                <Label htmlFor="editCustomerEmail">E-posta</Label>
                <Input
                  id="editCustomerEmail"
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  placeholder="email@domain.com"
                />
              </div>
              
              <div>
                <Label htmlFor="editCustomerSegment">Müşteri Segmenti</Label>
                <Input
                  id="editCustomerSegment"
                  value={editingCustomer.segment || 'Standart'}
                  onChange={(e) => setEditingCustomer({...editingCustomer, segment: e.target.value})}
                  placeholder="Standart, Premium, VIP"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveModal('customers')}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Başarılı",
                      description: "Müşteri bilgileri güncellendi",
                    });
                    setActiveModal('customers');
                    setEditingCustomer(null);
                  }}
                  disabled={!editingCustomer.name || !editingCustomer.phone}
                  className="flex-1"
                >
                  <i className="fas fa-save mr-2"></i>
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
