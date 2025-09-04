import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, Save, Users, Shield, ChevronDown, ChevronRight } from "lucide-react";

// Rol tanımları
const USER_ROLES = [
  { id: 'admin', name: 'Admin', description: 'Sistem yöneticisi - tüm yetkilere sahip' },
  { id: 'sales', name: 'Satış Personeli', description: 'Satış işlemleri ve müşteri yönetimi' },
  { id: 'production', name: 'Üretim Personeli', description: 'Üretim süreçleri ve sipariş takibi' },
  { id: 'shipping', name: 'Sevkiyat Personeli', description: 'Sevkiyat ve teslimat işlemleri' },
  { id: 'accounting', name: 'Muhasebe Personeli', description: 'Mali işlemler ve raporlar' }
];

// Sayfa ve her sayfaya özel işlem tanımları
const PAGES_WITH_ACTIONS = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    description: 'Ana sayfa ve genel istatistikler',
    icon: 'fas fa-chart-pie',
    actions: [
      { id: 'read', name: 'Görüntüle', description: 'Dashboard verilerini görüntüleme' },
      { id: 'export', name: 'Dışa Aktar', description: 'Dashboard raporlarını dışa aktarma' }
    ]
  },
  { 
    id: 'orders', 
    name: 'Siparişler', 
    description: 'Sipariş listesi ve yönetimi',
    icon: 'fas fa-clipboard-list',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni sipariş ekleme' },
      { id: 'read', name: 'Görüntüle', description: 'Siparişleri görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Sipariş bilgilerini düzenleme' },
      { id: 'delete', name: 'Sil', description: 'Siparişleri silme' },
      { id: 'approve', name: 'Onayla', description: 'Siparişleri onaylama' },
      { id: 'export', name: 'Dışa Aktar', description: 'Sipariş raporları dışa aktarma' }
    ]
  },
  { 
    id: 'sales', 
    name: 'Satış', 
    description: 'Satış işlemleri ve müşteri ziyaretleri',
    icon: 'fas fa-users',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni müşteri ve ziyaret ekleme' },
      { id: 'read', name: 'Görüntüle', description: 'Müşteri ve satış verilerini görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Müşteri bilgilerini düzenleme' },
      { id: 'delete', name: 'Sil', description: 'Müşteri kayıtlarını silme' },
      { id: 'export', name: 'Dışa Aktar', description: 'Müşteri ve satış raporları' }
    ]
  },
  { 
    id: 'sales-reports', 
    name: 'Satış Raporları', 
    description: 'Satış performansı ve analizler',
    icon: 'fas fa-chart-bar',
    actions: [
      { id: 'read', name: 'Görüntüle', description: 'Satış raporlarını görüntüleme' },
      { id: 'export', name: 'Dışa Aktar', description: 'Detaylı satış analiz raporları' }
    ]
  },
  { 
    id: 'invoices', 
    name: 'İrsaliyeler', 
    description: 'İrsaliye yönetimi',
    icon: 'fas fa-file-invoice',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni irsaliye oluşturma' },
      { id: 'read', name: 'Görüntüle', description: 'İrsaliyeleri görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'İrsaliye bilgilerini düzenleme' },
      { id: 'delete', name: 'Sil', description: 'İrsaliyeleri silme' },
      { id: 'approve', name: 'Onayla', description: 'İrsaliyeleri onaylama' },
      { id: 'export', name: 'Dışa Aktar', description: 'İrsaliye raporları dışa aktarma' }
    ]
  },
  { 
    id: 'production', 
    name: 'Üretim', 
    description: 'Üretim süreçleri ve planlama',
    icon: 'fas fa-cogs',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni üretim planı oluşturma' },
      { id: 'read', name: 'Görüntüle', description: 'Üretim verilerini görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Üretim planlarını düzenleme' },
      { id: 'approve', name: 'Onayla', description: 'Üretim işlemlerini onaylama' },
      { id: 'export', name: 'Dışa Aktar', description: 'Üretim raporları dışa aktarma' }
    ]
  },
  { 
    id: 'shipping', 
    name: 'Sevkiyat', 
    description: 'Sevkiyat ve teslimat yönetimi',
    icon: 'fas fa-truck',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni sevkiyat kaydı oluşturma' },
      { id: 'read', name: 'Görüntüle', description: 'Sevkiyat bilgilerini görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Sevkiyat durumunu güncelleme' },
      { id: 'approve', name: 'Onayla', description: 'Sevkiyatları onaylama' },
      { id: 'export', name: 'Dışa Aktar', description: 'Sevkiyat raporları dışa aktarma' }
    ]
  },
  { 
    id: 'mail-settings', 
    name: 'Mail Ayarları', 
    description: 'E-posta yapılandırmaları',
    icon: 'fas fa-envelope-open-text',
    actions: [
      { id: 'read', name: 'Görüntüle', description: 'Mail ayarlarını görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Mail yapılandırmalarını düzenleme' }
    ]
  },
  { 
    id: 'admin', 
    name: 'Yönetim', 
    description: 'Sistem yönetimi ve kullanıcılar',
    icon: 'fas fa-shield-alt',
    actions: [
      { id: 'create', name: 'Oluştur', description: 'Yeni kullanıcı ekleme' },
      { id: 'read', name: 'Görüntüle', description: 'Sistem bilgilerini görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Sistem ayarlarını düzenleme' },
      { id: 'delete', name: 'Sil', description: 'Kullanıcıları silme' },
      { id: 'export', name: 'Dışa Aktar', description: 'Sistem raporları dışa aktarma' }
    ]
  },
  { 
    id: 'permissions', 
    name: 'Yetkiler', 
    description: 'Rol ve yetki yönetimi',
    icon: 'fas fa-user-shield',
    actions: [
      { id: 'read', name: 'Görüntüle', description: 'Yetki ayarlarını görüntüleme' },
      { id: 'update', name: 'Düzenle', description: 'Rol yetkilerini düzenleme' }
    ]
  }
];

// Varsayılan yetki matrisi - her sayfa için ayrı ayrı yetkiler
const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  admin: {
    dashboard: ['read', 'export'],
    orders: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    sales: ['create', 'read', 'update', 'delete', 'export'],
    'sales-reports': ['read', 'export'],
    invoices: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    production: ['create', 'read', 'update', 'approve', 'export'],
    shipping: ['create', 'read', 'update', 'approve', 'export'],
    'mail-settings': ['read', 'update'],
    admin: ['create', 'read', 'update', 'delete', 'export'],
    permissions: ['read', 'update']
  },
  sales: {
    dashboard: ['read'],
    orders: ['create', 'read', 'update'],
    sales: ['create', 'read', 'update', 'export']
  },
  production: {
    dashboard: ['read'],
    orders: ['read', 'update'],
    production: ['create', 'read', 'update', 'approve', 'export']
  },
  shipping: {
    dashboard: ['read'],
    shipping: ['create', 'read', 'update', 'approve', 'export'],
    invoices: ['read', 'update', 'export']
  },
  accounting: {
    dashboard: ['read', 'export'],
    orders: ['read', 'export'],
    'sales-reports': ['read', 'export']
  }
};

export default function Permissions() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Record<string, Record<string, string[]>>>(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

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

  // Sadece admin erişebilir
  if (user?.role !== 'admin' && user?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Erişim Reddedildi</h3>
                <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const togglePageAccess = (roleId: string, pageId: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      if (newPermissions[roleId]?.[pageId]) {
        // Sayfa erişimi var, kaldır
        const { [pageId]: removed, ...rest } = newPermissions[roleId];
        newPermissions[roleId] = rest;
      } else {
        // Sayfa erişimi yok, sadece 'read' yetkisi ile ekle
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          [pageId]: ['read']
        };
      }
      
      setHasChanges(true);
      return newPermissions;
    });
  };

  const toggleActionPermission = (roleId: string, pageId: string, actionId: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const currentActions = newPermissions[roleId]?.[pageId] || [];
      
      if (currentActions.includes(actionId)) {
        // Aksiyonu kaldır
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          [pageId]: currentActions.filter(a => a !== actionId)
        };
      } else {
        // Aksiyonu ekle
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          [pageId]: [...currentActions, actionId]
        };
      }
      
      setHasChanges(true);
      return newPermissions;
    });
  };

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const savePermissions = () => {
    // Bu işlevsellik gelecekte backend ile entegre edilecek
    toast({
      title: "Başarılı",
      description: "Yetki ayarları kaydedildi",
    });
    setHasChanges(false);
  };

  const resetPermissions = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setHasChanges(false);
    setExpandedRoles([]);
    toast({
      title: "Sıfırlandı",
      description: "Yetki ayarları varsayılan değerlere döndürüldü",
    });
  };

  const hasPageAccess = (roleId: string, pageId: string) => {
    return Boolean(permissions[roleId]?.[pageId]);
  };

  const hasActionPermission = (roleId: string, pageId: string, actionId: string) => {
    return permissions[roleId]?.[pageId]?.includes(actionId) || false;
  };

  const getPagePermissionCount = (roleId: string) => {
    return Object.keys(permissions[roleId] || {}).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Yetki Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Kullanıcı rolleri ve sayfa erişim yetkilerini yönetin</p>
        </div>

        {hasChanges && (
          <div className="mb-6 p-4 border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                <span className="text-orange-800 dark:text-orange-200">Kaydedilmemiş değişiklikler var</span>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={resetPermissions}>
                  Sıfırla
                </Button>
                <Button size="sm" onClick={savePermissions}>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ana Yetki Yönetimi - Rol Bazlı Collapsible Kartlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Rol Bazlı Sayfa ve İşlem Yetkileri
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Her rol için sayfa erişimi ve o sayfalarda yapılabilecek işlemleri yönetin
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {USER_ROLES.map(role => (
                <div key={role.id} className="border rounded-lg">
                  <Collapsible 
                    open={expandedRoles.includes(role.id)}
                    onOpenChange={() => toggleRoleExpansion(role.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors rounded-t-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            {expandedRoles.includes(role.id) ? 
                              <ChevronDown className="w-4 h-4 text-muted-foreground" /> :
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-foreground">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {getPagePermissionCount(role.id)} sayfa
                          </Badge>
                          <Badge variant="secondary">
                            {Object.values(permissions[role.id] || {}).reduce((acc: number, actions: string[]) => acc + actions.length, 0)} yetki
                          </Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <div className="grid gap-4">
                          {PAGES_WITH_ACTIONS.map(page => {
                            const hasAccess = hasPageAccess(role.id, page.id);
                            return (
                              <div key={page.id} className="border rounded-lg p-3 bg-card/50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <i className={`${page.icon} text-lg ${hasAccess ? 'text-primary' : 'text-muted-foreground'}`}></i>
                                    <div>
                                      <h5 className="font-medium text-foreground">{page.name}</h5>
                                      <p className="text-xs text-muted-foreground">{page.description}</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={hasAccess}
                                    onCheckedChange={() => togglePageAccess(role.id, page.id)}
                                  />
                                </div>
                                
                                {hasAccess && (
                                  <div className="ml-8 space-y-2 border-t pt-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Bu sayfada yapılabilecek işlemler:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {page.actions.map(action => (
                                        <div key={action.id} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                                          <div className="flex-1">
                                            <div className="text-xs font-medium">{action.name}</div>
                                            <div className="text-xs text-muted-foreground">{action.description}</div>
                                          </div>
                                          <Switch
                                            checked={hasActionPermission(role.id, page.id, action.id)}
                                            onCheckedChange={() => toggleActionPermission(role.id, page.id, action.id)}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Yetki Matrisi Özeti */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Yetki Matrisi Özeti
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tüm roller için sayfa erişim yetkilerinin genel görünümü
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 border-b font-semibold">Rol</th>
                    {PAGES_WITH_ACTIONS.map(page => (
                      <th key={page.id} className="text-center p-3 border-b text-xs font-medium">
                        <div className="flex flex-col items-center">
                          <i className={`${page.icon} text-sm mb-1`}></i>
                          <span>{page.name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-3 border-b text-xs font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {USER_ROLES.map(role => (
                    <tr key={role.id} className="hover:bg-accent/30">
                      <td className="p-3 border-b font-medium">
                        <div>
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </td>
                      {PAGES_WITH_ACTIONS.map(page => (
                        <td key={page.id} className="text-center p-3 border-b">
                          {hasPageAccess(role.id, page.id) ? (
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
                              <span className="text-xs text-green-700 dark:text-green-300">
                                {permissions[role.id]?.[page.id]?.length || 0}
                              </span>
                            </div>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-300 mx-auto"></div>
                          )}
                        </td>
                      ))}
                      <td className="text-center p-3 border-b">
                        <Badge variant="outline">
                          {getPagePermissionCount(role.id)} sayfa
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}