import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-chart-pie" },
    { path: "/sales", label: "Satış", icon: "fas fa-users" },
    { path: "/production", label: "Üretim", icon: "fas fa-cogs" },
    { path: "/shipping", label: "Sevkiyat", icon: "fas fa-truck" },
    { path: "/admin", label: "Yönetim", icon: "fas fa-shield-alt", adminOnly: true },
  ];

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

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
                <DropdownMenuItem className="cursor-pointer">
                  <i className="fas fa-user mr-2"></i>
                  Profili Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
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
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                    <i className="fas fa-bars"></i>
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
    </header>
  );
}
