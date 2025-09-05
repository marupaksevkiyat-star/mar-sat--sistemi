import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";

export default function Appointments() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [newAppointment, setNewAppointment] = useState({
    customerId: "",
    appointmentType: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  });

  // Randevuları getir
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/appointments'],
    enabled: isAuthenticated,
  });

  // Müşterileri getir
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
    enabled: isAuthenticated,
  });

  // Yeni randevu oluşturma mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      return apiRequest('/api/appointments', 'POST', appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla oluşturuldu.",
      });
      setShowCreateDialog(false);
      setNewAppointment({
        customerId: "",
        appointmentType: "",
        scheduledDate: "",
        scheduledTime: "",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Randevu güncelleme mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, action, data }: any) => {
      return apiRequest(`/api/appointments/${appointmentId}`, 'PATCH', { action, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
  });

  // URL'den customer parametresini al
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customer');
    if (customerId && customers) {
      const customer = customers.find((c: any) => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setNewAppointment(prev => ({
          ...prev,
          customerId: customerId
        }));
        setShowCreateDialog(true);
      }
    }
  }, [customers, location]);

  const handleCreateAppointment = () => {
    if (!newAppointment.customerId || !newAppointment.scheduledDate || !newAppointment.scheduledTime || !newAppointment.appointmentType) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    const appointmentDateTime = new Date(`${newAppointment.scheduledDate}T${newAppointment.scheduledTime}:00`);
    
    createAppointmentMutation.mutate({
      customerId: newAppointment.customerId,
      appointmentType: newAppointment.appointmentType,
      scheduledDate: appointmentDateTime,
      notes: newAppointment.notes,
      salesPersonId: user?.id,
    });
  };

  const handleAppointmentAction = (appointmentId: string, action: string, customerId?: string) => {
    let updateData = {};
    
    if (action === 'complete') {
      updateData = { status: 'completed', completedAt: new Date() };
    } else if (action === 'cancel') {
      updateData = { status: 'cancelled' };
    } else if (action === 'reschedule') {
      updateData = { status: 'rescheduled' };
    } else if (action === 'call_customer' && customerId) {
      window.location.href = `tel:${customers?.find((c: any) => c.id === customerId)?.phone}`;
      return;
    } else if (action === 'navigate' && customerId) {
      const customer = customers?.find((c: any) => c.id === customerId);
      if (customer?.address) {
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(customer.address)}`, '_blank');
      }
      return;
    }

    updateAppointmentMutation.mutate({
      appointmentId,
      action,
      data: updateData
    });
  };

  // Filtered appointments with useMemo
  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    if (filterStatus === "all") return appointments;
    return appointments.filter((appointment: any) => appointment.status === filterStatus);
  }, [appointments, filterStatus]);

  if (isLoading || appointmentsLoading) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Planlandı</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">İptal Edildi</Badge>;
      case 'rescheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Ertelendi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAppointmentTypeBadge = (type: string) => {
    switch (type) {
      case 'visit':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Ziyaret</Badge>;
      case 'call':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Telefon</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Navigation */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Geri
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Randevular</h1>
            <p className="text-muted-foreground mt-2">
              Müşteri randevularınızı planlayın ve yönetin
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i>
                Yeni Randevu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">
                    Müşteri *
                  </Label>
                  <Select 
                    value={newAppointment.customerId} 
                    onValueChange={(value) => {
                      setNewAppointment(prev => ({ ...prev, customerId: value }));
                      const customer = customers?.find((c: any) => c.id === value);
                      setSelectedCustomer(customer);
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName || customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tür *
                  </Label>
                  <Select 
                    value={newAppointment.appointmentType} 
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, appointmentType: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Randevu türü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit">Ziyaret</SelectItem>
                      <SelectItem value="call">Telefon Görüşmesi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Tarih *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    className="col-span-3"
                    value={newAppointment.scheduledDate}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Saat *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    className="col-span-3"
                    value={newAppointment.scheduledTime}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notlar
                  </Label>
                  <Textarea
                    id="notes"
                    className="col-span-3"
                    placeholder="Randevu ile ilgili notlar..."
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleCreateAppointment}
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending ? "Oluşturuluyor..." : "Randevu Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Tümü ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Planlandı ({appointments.filter((a: any) => a.status === 'scheduled').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Tamamlandı ({appointments.filter((a: any) => a.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              İptal ({appointments.filter((a: any) => a.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-6">
            <div className="grid gap-4">
              {filteredAppointments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">
                      {filterStatus === "all" ? "Henüz randevu yok" : `${filterStatus} durumunda randevu bulunamadı`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppointments.map((appointment: any) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          {appointment.customer?.name || "Bilinmeyen Müşteri"}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(appointment.status)}
                          {getAppointmentTypeBadge(appointment.appointmentType)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fas fa-clock text-primary"></i>
                          <span>
                            {new Date(appointment.scheduledDate).toLocaleDateString('tr-TR')} - 
                            {new Date(appointment.scheduledDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {appointment.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <i className="fas fa-sticky-note text-primary mt-1"></i>
                            <span className="text-muted-foreground">{appointment.notes}</span>
                          </div>
                        )}
                        
                        {appointment.customer?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-phone text-primary"></i>
                            <span>{appointment.customer.phone}</span>
                          </div>
                        )}
                        
                        {appointment.customer?.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <i className="fas fa-map-marker-alt text-primary mt-1"></i>
                            <span className="text-muted-foreground">{appointment.customer.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                        {appointment.status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <i className="fas fa-check mr-1"></i>
                              Tamamla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAppointmentAction(appointment.id, 'reschedule')}
                            >
                              <i className="fas fa-calendar-alt mr-1"></i>
                              Ertele
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <i className="fas fa-times mr-1"></i>
                              İptal
                            </Button>
                          </>
                        )}
                        
                        {appointment.customer?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAppointmentAction(appointment.id, 'call_customer', appointment.customerId)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <i className="fas fa-phone mr-1"></i>
                            Ara
                          </Button>
                        )}
                        
                        {appointment.customer?.address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAppointmentAction(appointment.id, 'navigate', appointment.customerId)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            Yol Tarifi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}