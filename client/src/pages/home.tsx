import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import StatsCard from "@/components/dashboard/stats-card";
import RecentOrders from "@/components/dashboard/recent-orders";
import Schedule from "@/components/dashboard/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    refetchInterval: 30000, // 30 saniyede bir otomatik yenile
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
    retry: false,
    refetchInterval: 30000, // 30 saniyede bir otomatik yenile
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/dashboard/today-appointments"],
    retry: false,
    refetchInterval: 60000, // 1 dakikada bir otomatik yenile
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

  const getDashboardTitle = () => {
    const userRole = user?.role || '';
    
    if (userRole === 'admin' || userRole === 'Admin') return "Yönetici Dashboard";
    if (userRole === 'sales' || userRole === 'sales_staff' || userRole.includes('Satış')) return "Satış Dashboard";
    if (userRole === 'production' || userRole.includes('Üretim')) return "Üretim Dashboard";
    if (userRole === 'shipping' || userRole.includes('Sevkiyat')) return "Sevkiyat Dashboard";
    if (userRole === 'accounting' || userRole.includes('Muhasebe')) return "Muhasebe Dashboard";
    
    return "Dashboard";
  };

  const getStatsCards = () => {
    const userRole = user?.role || '';
    
    // Admin - tüm kartları görebilir
    if (userRole === 'admin' || userRole === 'Admin') {
      return [
        {
          title: "Bekleyen Siparişler",
          value: (stats as any)?.pendingOrders?.toString() || "0",
          subtitle: "onay bekliyor",
          icon: "fas fa-clock",
          color: "orange",
          onClick: () => setLocation('/production')
        },
        {
          title: "Üretimde", 
          value: (stats as any)?.productionOrders?.toString() || "0",
          subtitle: "üretim + hazır",
          icon: "fas fa-cogs",
          color: "blue",
          onClick: () => setLocation('/orders?status=production')
        },
        {
          title: "Sevkiyat",
          value: (stats as any)?.shippingOrders?.toString() || "0",
          subtitle: "yolda",
          icon: "fas fa-truck",
          color: "purple",
          onClick: () => setLocation('/shipping')
        },
        {
          title: "Teslim Edilen",
          value: (stats as any)?.deliveredOrders?.toString() || "0",
          subtitle: "tamamlandı",
          icon: "fas fa-check-circle",
          color: "green",
          onClick: () => setLocation('/orders?status=delivered')
        },
        {
          title: "Günlük Ziyaretler",
          value: (stats as any)?.dailyVisits?.toString() || "0",
          change: "+12%",
          changeType: "positive",
          icon: "fas fa-map-marker-alt",
          color: "cyan",
          onClick: () => setLocation('/sales')
        },
        {
          title: "Aylık Satış",
          value: (stats as any)?.monthlySales ? `₺${((stats as any).monthlySales / 1000).toFixed(1)}K` : "₺0",
          change: "+8.2%",
          changeType: "positive",
          icon: "fas fa-lira-sign",
          color: "emerald",
          onClick: () => setLocation('/sales-reports')
        }
      ];
    }
    
    // Satış personeli - satış odaklı kartlar
    if (userRole === 'sales' || userRole === 'sales_staff' || userRole.includes('Satış')) {
      return [
        {
          title: "Bugünkü Ziyaretler",
          value: (stats as any)?.dailyVisits?.toString() || "0",
          change: "+12%",
          changeType: "positive",
          icon: "fas fa-map-marker-alt",
          color: "blue",
          onClick: () => setLocation('/sales')
        },
        {
          title: "Başarılı Satışlar",
          value: (stats as any)?.successfulSales?.toString() || "0",
          subtitle: "bu ay",
          icon: "fas fa-check-circle",
          color: "green",
          onClick: () => setLocation('/sales')
        },
        {
          title: "Bekleyen Randevular",
          value: (stats as any)?.pendingAppointments?.toString() || "0",
          icon: "fas fa-calendar-alt",
          color: "orange",
          onClick: () => setLocation('/sales')
        },
        {
          title: "Potansiyel Müşteriler",
          value: (stats as any)?.potentialCustomers?.toString() || "0",
          icon: "fas fa-users",
          color: "purple",
          onClick: () => setLocation('/sales')
        }
      ];
    }
    
    // Üretim personeli - üretim odaklı kartlar
    if (userRole === 'production' || userRole.includes('Üretim')) {
      return [
        {
          title: "Bekleyen Siparişler",
          value: (stats as any)?.pendingOrders?.toString() || "0",
          icon: "fas fa-clock",
          color: "yellow",
          onClick: () => setLocation('/production')
        },
        {
          title: "Aktif Üretim",
          value: (stats as any)?.activeProduction?.toString() || "0",
          subtitle: "üretimde",
          icon: "fas fa-cogs",
          color: "blue",
          onClick: () => setLocation('/production')
        },
        {
          title: "Tamamlanan",
          value: (stats as any)?.completedProduction?.toString() || "0",
          subtitle: "bu hafta",
          icon: "fas fa-check-circle",
          color: "green",
          onClick: () => setLocation('/production')
        },
        {
          title: "Ortalama Süre",
          value: (stats as any)?.averageProductionTime || "0 gün",
          subtitle: "üretim süresi",
          icon: "fas fa-clock",
          color: "purple",
          onClick: () => setLocation('/production')
        }
      ];
    }
    
    // Sevkiyat personeli - sevkiyat odaklı kartlar
    if (userRole === 'shipping' || userRole.includes('Sevkiyat')) {
      return [
        {
          title: "Sevkiyata Hazır",
          value: (stats as any)?.productionOrders?.toString() || "0",
          subtitle: "üretim tamamlandı",
          icon: "fas fa-box",
          color: "blue",
          onClick: () => setLocation('/shipping')
        },
        {
          title: "Yolda",
          value: (stats as any)?.shippingOrders?.toString() || "0",
          subtitle: "teslimat",
          icon: "fas fa-truck",
          color: "yellow",
          onClick: () => setLocation('/shipping')
        },
        {
          title: "Teslim Edildi",
          value: (stats as any)?.deliveredOrders?.toString() || "0",
          subtitle: "toplam",
          icon: "fas fa-check-circle",
          color: "green",
          onClick: () => setLocation('/shipping')
        },
        {
          title: "Teslimat Oranı",
          value: (stats as any)?.deliveryRate ? `${(stats as any).deliveryRate}%` : "0%",
          icon: "fas fa-percentage",
          color: "purple",
          onClick: () => setLocation('/shipping')
        }
      ];
    }
    
    // Varsayılan - temel kartlar
    return [
      {
        title: "Genel Durum",
        value: "Aktif",
        icon: "fas fa-chart-pie",
        color: "blue",
        onClick: () => setLocation('/admin')
      }
    ];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">{getDashboardTitle()}</h2>
          <p className="text-muted-foreground mt-1">
            {user?.firstName} {user?.lastName} - {user?.role === 'admin' || user?.role === 'Admin' ? 'Yönetici' : 
             user?.role === 'sales' || user?.role === 'sales_staff' ? 'Satış Personeli' :
             user?.role === 'production' ? 'Üretim Personeli' :
             user?.role === 'shipping' ? 'Sevkiyat Personeli' : user?.role}
          </p>
        </div>

        {/* Role-based Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getStatsCards().map((card, index) => (
            <StatsCard
              key={index}
              title={card.title}
              value={card.value}
              change={card.change}
              changeType={card.changeType as "positive" | "negative" | undefined}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color as "blue" | "green" | "yellow" | "purple" | "red" | "cyan" | "orange" | "emerald"}
              isLoading={statsLoading}
              onClick={card.onClick}
              data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            />
          ))}
        </div>

        {/* Recent Activities & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentOrders orders={recentOrders as any} isLoading={ordersLoading} />
          </div>
          
          <div>
            <Schedule appointments={todayAppointments as any} isLoading={appointmentsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
