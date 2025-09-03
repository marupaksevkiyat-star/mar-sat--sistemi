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

export default function Home() {
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
    retry: false,
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/dashboard/today-appointments"],
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Genel sistem durumu ve önemli metrikleri</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Günlük Ziyaretler"
            value={(stats as any)?.dailyVisits?.toString() || "0"}
            change="+12%"
            changeType="positive"
            icon="fas fa-map-marker-alt"
            color="blue"
            isLoading={statsLoading}
            data-testid="card-daily-visits"
          />
          
          <StatsCard
            title="Aktif Siparişler"
            value={(stats as any)?.activeOrders?.toString() || "0"}
            subtitle="üretimde"
            icon="fas fa-clipboard-list"
            color="yellow"
            isLoading={statsLoading}
            data-testid="card-active-orders"
          />
          
          <StatsCard
            title="Aylık Satış"
            value={(stats as any)?.monthlySales ? `₺${((stats as any).monthlySales / 1000).toFixed(1)}K` : "₺0"}
            change="+8.2%"
            changeType="positive"
            icon="fas fa-lira-sign"
            color="green"
            isLoading={statsLoading}
            data-testid="card-monthly-sales"
          />
          
          <StatsCard
            title="Teslimat Oranı"
            value={(stats as any)?.deliveryRate ? `${(stats as any).deliveryRate}%` : "0%"}
            subtitle="Mükemmel performans"
            icon="fas fa-truck"
            color="purple"
            isLoading={statsLoading}
            data-testid="card-delivery-rate"
          />
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
