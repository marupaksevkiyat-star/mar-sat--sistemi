import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || 'admin@system.com'
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const getNavigationItems = () => {
    const userRole = user?.role || '';
    
    // Admin - tüm sayfaları görebilir
    if (userRole === 'admin' || userRole === 'Admin') {
      return [
        { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
        { path: "/orders", label: "Siparişler", icon: "fas fa-clipboard-list" },
        { path: "/customers", label: "Müşteriler", icon: "fas fa-building" },
        { path: "/sales", label: "Satış", icon: "fas fa-users" },
        { path: "/sales-reports", label: "Satış Raporları", icon: "fas fa-chart-bar" },
        { path: "/invoices", label: "İrsaliyeler", icon: "fas fa-file-invoice" },
        { path: "/production", label: "Üretim", icon: "fas fa-cogs" },
        { path: "/shipping", label: "Sevkiyat", icon: "fas fa-truck" },
        { path: "/admin", label: "Yönetim", icon: "fas fa-shield-alt" },
      ];
    }
    
    // Satış personeli - sadece satış sayfalarını görebilir
    if (userRole === 'sales' || userRole === 'sales_staff' || userRole.includes('Satış')) {
      return [
        { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
        { path: "/orders", label: "Siparişler", icon: "fas fa-clipboard-list" },
        { path: "/customers", label: "Müşteriler", icon: "fas fa-building" },
        { path: "/sales", label: "Satış", icon: "fas fa-users" },
      ];
    }
    
    // Üretim personeli - sadece üretim sayfalarını görebilir
    if (userRole === 'production' || userRole === 'production_staff' || userRole.includes('Üretim')) {
      return [
        { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
        { path: "/orders", label: "Siparişler", icon: "fas fa-clipboard-list" },
        { path: "/production", label: "Üretim", icon: "fas fa-cogs" },
      ];
    }
    
    // Sevkiyat personeli - sadece sevkiyat sayfalarını görebilir
    if (userRole === 'shipping' || userRole === 'shipping_staff' || userRole.includes('Sevkiyat')) {
      return [
        { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
        { path: "/shipping", label: "Sevkiyat", icon: "fas fa-truck" },
      ];
    }
    
    // Muhasebe personeli - dashboard ve kendi alanları
    if (userRole === 'accounting' || userRole.includes('Muhasebe')) {
      return [
        { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
        { path: "/orders", label: "Siparişler", icon: "fas fa-clipboard-list" },
        { path: "/invoices", label: "Muhasebe", icon: "fas fa-calculator" },
      ];
    }
    
    // Varsayılan - sadece dashboard ve siparişler
    return [
      { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
      { path: "/orders", label: "Siparişler", icon: "fas fa-clipboard-list" },
    ];
  };

  const filteredItems = getNavigationItems();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const NavItems = ({ mobile = false }) => (
    <>
      {filteredItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`${
            mobile
              ? "flex items-center py-3 px-4 text-base"
              : "flex items-center px-4 py-2 text-sm"
          } ${
            isActive(item.path)
              ? "text-primary bg-primary/10 border-r-2 border-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          } transition-colors duration-200`}
          data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
          onClick={() => mobile && setMobileOpen(false)}
        >
          <i className={`${item.icon} ${mobile ? "mr-3" : "mr-2"}`}></i>
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" data-testid="link-home">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-industry text-primary-foreground"></i>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-foreground">Üretim Sistemi</h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            <NavItems />
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-sm hover:bg-accent" data-testid="button-user-menu">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <span className="font-medium text-secondary-foreground" data-testid="text-user-initials">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <span className="hidden sm:block text-foreground" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <i className="fas fa-chevron-down text-xs text-muted-foreground"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === 'Admin' ? 'Yönetici' : 
                     user?.role?.includes('Müdürü') ? user?.role :
                     user?.role?.includes('Personeli') ? user?.role :
                     user?.role}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    setProfileData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || 'admin@system.com'
                    });
                    setProfileOpen(true);
                  }}
                >
                  <i className="fas fa-user mr-2"></i>
                  Profili Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setSettingsOpen(true)}
                >
                  <i className="fas fa-cog mr-2"></i>
                  Ayarlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="block md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 hover:bg-accent"
                    data-testid="button-mobile-menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center p-4 border-b border-border">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                        <span className="font-medium text-secondary-foreground">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.role === 'admin' ? 'Yönetici' : 
                           user?.role === 'sales' ? 'Satış' :
                           user?.role === 'production' ? 'Üretim' :
                           user?.role === 'shipping' ? 'Sevkiyat' : user?.role}
                        </p>
                      </div>
                    </div>
                    
                    <nav className="flex-1 py-4">
                      <NavItems mobile />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-user text-blue-600"></i>
              Profili Düzenle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Ad</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                placeholder="Adınız"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Soyad</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                placeholder="Soyadınız"
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                placeholder="email@domain.com"
              />
            </div>
            
            <div>
              <Label htmlFor="newPassword">Yeni Şifre (İsteğe bağlı)</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Boş bırakılırsa şifre değişmez"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setProfileOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Başarılı",
                    description: "Profil bilgileriniz güncellendi",
                  });
                  setProfileOpen(false);
                }}
                className="flex-1"
              >
                <i className="fas fa-save mr-2"></i>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-cog text-blue-600"></i>
              Ayarlar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Bildirim Ayarları</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Yeni siparişler için e-posta alın</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Acil durumlar için SMS alın</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Masaüstü Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Tarayıcı bildirimlerini etkinleştir</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Görünüm Ayarları</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Koyu Tema</Label>
                  <p className="text-sm text-muted-foreground">Gece modunu etkinleştir</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kompakt Görünüm</Label>
                  <p className="text-sm text-muted-foreground">Daha sıkışık arayüz</p>
                </div>
                <Switch />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setSettingsOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Başarılı",
                    description: "Ayarlarınız kaydedildi",
                  });
                  setSettingsOpen(false);
                }}
                className="flex-1"
              >
                <i className="fas fa-save mr-2"></i>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
