import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save, Users, Shield, Settings } from "lucide-react";

// Rol tanımları
const USER_ROLES = [
  { id: 'admin', name: 'Admin', description: 'Sistem yöneticisi - tüm yetkilere sahip' },
  { id: 'sales', name: 'Satış Personeli', description: 'Satış işlemleri ve müşteri yönetimi' },
  { id: 'production', name: 'Üretim Personeli', description: 'Üretim süreçleri ve sipariş takibi' },
  { id: 'shipping', name: 'Sevkiyat Personeli', description: 'Sevkiyat ve teslimat işlemleri' },
  { id: 'accounting', name: 'Muhasebe Personeli', description: 'Mali işlemler ve raporlar' }
];

// Sayfa ve işlem tanımları
const PAGES_AND_ACTIONS = {
  pages: [
    { id: 'dashboard', name: 'Dashboard', description: 'Ana sayfa ve genel istatistikler' },
    { id: 'orders', name: 'Siparişler', description: 'Sipariş listesi ve yönetimi' },
    { id: 'sales', name: 'Satış', description: 'Satış işlemleri ve müşteri ziyaretleri' },
    { id: 'sales-reports', name: 'Satış Raporları', description: 'Satış performansı ve analizler' },
    { id: 'invoices', name: 'İrsaliyeler', description: 'İrsaliye yönetimi' },
    { id: 'production', name: 'Üretim', description: 'Üretim süreçleri ve planlama' },
    { id: 'shipping', name: 'Sevkiyat', description: 'Sevkiyat ve teslimat yönetimi' },
    { id: 'mail-settings', name: 'Mail Ayarları', description: 'E-posta yapılandırmaları' },
    { id: 'admin', name: 'Yönetim', description: 'Sistem yönetimi ve kullanıcılar' },
    { id: 'permissions', name: 'Yetkiler', description: 'Rol ve yetki yönetimi' }
  ],
  actions: [
    { id: 'create', name: 'Oluştur', description: 'Yeni kayıt ekleme' },
    { id: 'read', name: 'Görüntüle', description: 'Verileri görüntüleme' },
    { id: 'update', name: 'Düzenle', description: 'Mevcut kayıtları düzenleme' },
    { id: 'delete', name: 'Sil', description: 'Kayıtları silme' },
    { id: 'export', name: 'Dışa Aktar', description: 'Rapor ve veri dışa aktarma' },
    { id: 'approve', name: 'Onayla', description: 'İşlemleri onaylama' }
  ]
};

// Varsayılan yetki matrisi
const DEFAULT_PERMISSIONS = {
  admin: {
    pages: ['dashboard', 'orders', 'sales', 'sales-reports', 'invoices', 'production', 'shipping', 'mail-settings', 'admin', 'permissions'],
    actions: ['create', 'read', 'update', 'delete', 'export', 'approve']
  },
  sales: {
    pages: ['dashboard', 'orders', 'sales'],
    actions: ['create', 'read', 'update']
  },
  production: {
    pages: ['dashboard', 'orders', 'production'],
    actions: ['read', 'update', 'approve']
  },
  shipping: {
    pages: ['dashboard', 'shipping', 'invoices'],
    actions: ['read', 'update', 'export']
  },
  accounting: {
    pages: ['dashboard', 'orders', 'sales-reports'],
    actions: ['read', 'export']
  }
};

export default function Permissions() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);

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

  const togglePagePermission = (roleId: string, pageId: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const rolePages = [...(newPermissions[roleId]?.pages || [])];
      
      if (rolePages.includes(pageId)) {
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          pages: rolePages.filter(p => p !== pageId)
        };
      } else {
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          pages: [...rolePages, pageId]
        };
      }
      
      setHasChanges(true);
      return newPermissions;
    });
  };

  const toggleActionPermission = (roleId: string, actionId: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const roleActions = [...(newPermissions[roleId]?.actions || [])];
      
      if (roleActions.includes(actionId)) {
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          actions: roleActions.filter(a => a !== actionId)
        };
      } else {
        newPermissions[roleId] = {
          ...newPermissions[roleId],
          actions: [...roleActions, actionId]
        };
      }
      
      setHasChanges(true);
      return newPermissions;
    });
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
    toast({
      title: "Sıfırlandı",
      description: "Yetki ayarları varsayılan değerlere döndürüldü",
    });
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

        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pages" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Sayfa Yetkileri
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              İşlem Yetkileri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Sayfa Erişim Yetkileri
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Her rol için hangi sayfalara erişim sağlanacağını belirleyin
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {USER_ROLES.map(role => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <Badge variant="outline">
                            {permissions[role.id]?.pages?.length || 0} sayfa
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PAGES_AND_ACTIONS.pages.map(page => (
                          <div key={page.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{page.name}</div>
                              <div className="text-xs text-muted-foreground">{page.description}</div>
                            </div>
                            <Switch
                              checked={permissions[role.id]?.pages?.includes(page.id) || false}
                              onCheckedChange={() => togglePagePermission(role.id, page.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  İşlem Yetkileri
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Her rol için hangi işlemlerin gerçekleştirilebileceğini belirleyin
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {USER_ROLES.map(role => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <Badge variant="outline">
                            {permissions[role.id]?.actions?.length || 0} işlem
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PAGES_AND_ACTIONS.actions.map(action => (
                          <div key={action.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{action.name}</div>
                              <div className="text-xs text-muted-foreground">{action.description}</div>
                            </div>
                            <Switch
                              checked={permissions[role.id]?.actions?.includes(action.id) || false}
                              onCheckedChange={() => toggleActionPermission(role.id, action.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Yetki Matrisi Özeti */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Yetki Matrisi Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b font-semibold">Rol</th>
                    {PAGES_AND_ACTIONS.pages.map(page => (
                      <th key={page.id} className="text-center p-2 border-b text-xs font-medium">
                        {page.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {USER_ROLES.map(role => (
                    <tr key={role.id}>
                      <td className="p-2 border-b font-medium">{role.name}</td>
                      {PAGES_AND_ACTIONS.pages.map(page => (
                        <td key={page.id} className="text-center p-2 border-b">
                          {permissions[role.id]?.pages?.includes(page.id) ? (
                            <Badge variant="default" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                          ) : (
                            <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-gray-300"></Badge>
                          )}
                        </td>
                      ))}
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