import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleProps {
  appointments: any[];
  isLoading?: boolean;
}

export default function Schedule({ appointments, isLoading = false }: ScheduleProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBorderColor = (index: number) => {
    const colors = ['border-primary', 'border-orange-400', 'border-green-400', 'border-blue-400'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Bugünkü Randevular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-l-4 border-gray-200 pl-4 py-2">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>
          <Skeleton className="w-full h-10 mt-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Bugünkü Randevular</CardTitle>
      </CardHeader>
      <CardContent>
        {!appointments || appointments.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-calendar text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">Bugün randevu bulunmamaktadır</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={`border-l-4 ${getBorderColor(index)} pl-4 py-2`}
                  data-testid={`appointment-${appointment.id}`}
                >
                  <p className="font-medium text-foreground" data-testid={`appointment-customer-${appointment.id}`}>
                    {appointment.customer?.companyName || appointment.customer?.name || 'Bilinmeyen Müşteri'}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid={`appointment-time-${appointment.id}`}>
                    {formatTime(appointment.scheduledDate)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" data-testid={`appointment-location-${appointment.id}`}>
                    {appointment.customer?.address || 'Adres bilgisi yok'}
                  </p>
                </div>
              ))}
            </div>
            
            <Button 
              variant="secondary" 
              className="w-full mt-6" 
              data-testid="button-view-all-appointments"
            >
              Tüm Randevular
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
