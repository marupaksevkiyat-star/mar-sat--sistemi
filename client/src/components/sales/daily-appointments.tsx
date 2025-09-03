import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Phone } from "lucide-react";

interface DailyAppointmentsProps {
  onStartVisit: (customer: any) => void;
}

export default function DailyAppointments({ onStartVisit }: DailyAppointmentsProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayAppointments, isLoading } = useQuery({
    queryKey: ["/api/appointments/today", today],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Bugünkü Randevular
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

  const appointments = (todayAppointments as any[]) || [];
  const now = new Date();
  
  // Sort appointments by time
  const sortedAppointments = appointments.sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  // Categorize appointments
  const upcoming = sortedAppointments.filter(app => 
    new Date(app.scheduledDate) > now && app.status === 'scheduled'
  );
  const overdue = sortedAppointments.filter(app => 
    new Date(app.scheduledDate) <= now && app.status === 'scheduled'
  );
  const completed = sortedAppointments.filter(app => app.status === 'completed');

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentStatus = (appointment: any) => {
    const appointmentTime = new Date(appointment.scheduledDate);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));

    if (appointment.status === 'completed') {
      return { variant: 'secondary' as const, text: 'Tamamlandı' };
    }
    
    if (minutesUntil < 0) {
      return { variant: 'destructive' as const, text: 'Geçti' };
    }
    
    if (minutesUntil <= 30) {
      return { variant: 'default' as const, text: 'Yakında' };
    }
    
    return { variant: 'outline' as const, text: 'Planlandı' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Bugünkü Randevular
          {(upcoming.length + overdue.length) > 0 && (
            <Badge variant="default" className="ml-auto">
              {upcoming.length + overdue.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Bugün için randevu yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overdue appointments - shown first */}
            {overdue.map((appointment) => (
              <div key={appointment.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{appointment.title}</h4>
                      <Badge variant="destructive" className="text-xs">
                        Geçti
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {appointment.customer?.name || appointment.customer?.companyName}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(appointment.scheduledDate)}
                      </span>
                      {appointment.customer?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {appointment.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStartVisit(appointment.customer)}
                    className="ml-2"
                  >
                    Ziyaret Et
                  </Button>
                </div>
              </div>
            ))}

            {/* Upcoming appointments */}
            {upcoming.map((appointment) => {
              const status = getAppointmentStatus(appointment);
              return (
                <div key={appointment.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{appointment.title}</h4>
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {appointment.customer?.name || appointment.customer?.companyName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(appointment.scheduledDate)}
                        </span>
                        {appointment.customer?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {appointment.customer.phone}
                          </span>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartVisit(appointment.customer)}
                      className="ml-2"
                    >
                      Ziyaret Et
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Completed appointments */}
            {completed.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-3 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{appointment.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        Tamamlandı
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {appointment.customer?.name || appointment.customer?.companyName}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(appointment.scheduledDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}