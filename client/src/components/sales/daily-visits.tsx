import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function DailyVisits() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dailyVisits, isLoading } = useQuery({
    queryKey: ["/api/visits", today],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Bugünkü Ziyaretler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visits = (dailyVisits as any[]) || [];

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'sale':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'follow_up':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'not_interested':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'sale':
        return { variant: 'default' as const, text: 'Satış Yapıldı', className: 'bg-green-100 text-green-800' };
      case 'follow_up':
        return { variant: 'secondary' as const, text: 'Takip Edilecek', className: 'bg-orange-100 text-orange-800' };
      case 'not_interested':
        return { variant: 'outline' as const, text: 'İlgilenmiyor', className: 'bg-red-100 text-red-800' };
      default:
        return { variant: 'outline' as const, text: 'Belirtilmemiş', className: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Bugünkü Ziyaretler
          {visits.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {visits.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-6">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Bugün henüz ziyaret yapılmamış</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {visits.map((visit) => {
              const badge = getOutcomeBadge(visit.outcome);
              return (
                <div 
                  key={visit.id} 
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  data-testid={`visit-${visit.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(visit.outcome)}
                      <h4 className="font-medium text-sm">
                        {visit.customer?.name || visit.customer?.companyName || 'Yeni Müşteri'}
                      </h4>
                    </div>
                    <Badge className={badge.className}>
                      {badge.text}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(visit.createdAt)}
                    </div>
                    
                    {visit.customer?.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {visit.customer.address}
                        </span>
                      </div>
                    )}
                    
                    {visit.notes && (
                      <p className="italic text-xs">
                        "{visit.notes}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}