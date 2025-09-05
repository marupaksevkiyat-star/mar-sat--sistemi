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

  // URL'den customer parametresini al
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customer');
    if (customerId) {
      setNewAppointment(prev => ({ ...prev, customerId }));
      setShowCreateDialog(true);
    }
  }, [location]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Lütfen giriş yapın",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Randevuları çek
  const { data: appointments, isLoading: appointmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/appointments"],
    enabled: !!isAuthenticated,
    retry: false,
  });

  // Müşterileri çek
  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    enabled: !!isAuthenticated,
    retry: false,
  });

  // Randevu oluşturma
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      return await apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowCreateDialog(false);
      setNewAppointment({
        customerId: "",
        appointmentType: "",
        scheduledDate: "",
        scheduledTime: "",
        notes: "",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Randevu güncelleme (durum değişikliği)
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, action, data }: { appointmentId: string; action: string; data?: any }) => {
      return await apiRequest("PATCH", `/api/appointments/${appointmentId}`, { action, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Başarılı",
        description: "İşlem başarıyla gerçekleştirildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleCreateAppointment = () => {
    if (!newAppointment.customerId || !newAppointment.appointmentType || !newAppointment.scheduledDate || !newAppointment.scheduledTime) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun",
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
    
    if (action === 'sale_completed') {
      // Satış tamamlandı - müşteriyi aktif yap
      updateData = { customerStatus: 'active' };
    } else if (action === 'follow_up_needed') {
      // Takip gerekiyor - müşteriyi potansiyel bırak
      updateData = { customerStatus: 'potential' };
    } else if (action === 'not_interested') {
      // İlgilenmiyor - müşteriyi pasif yap
      updateData = { customerStatus: 'inactive' };
    }

    updateAppointmentMutation.mutate({
      appointmentId,
      action,
      data: updateData
    });
  };

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

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (filterStatus === "all") return appointments;
    return appointments.filter(appointment => appointment.status === filterStatus);
  }, [appointments, filterStatus]);

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
      <div className="container mx-auto py-8 px-4">
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
              Müşteri randevularını yönetin ve takip edin
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-create-appointment">
                <i className="fas fa-plus"></i>
                Yeni Randevu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer">Müşteri *</Label>
                  <Select value={newAppointment.customerId} onValueChange={(value) => 
                    setNewAppointment(prev => ({ ...prev, customerId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName} - {customer.contactPerson}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Randevu Türü *</Label>
                  <Select value={newAppointment.appointmentType} onValueChange={(value) => 
                    setNewAppointment(prev => ({ ...prev, appointmentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Randevu türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit">Ziyaret</SelectItem>
                      <SelectItem value="call">Telefon Araması</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Tarih *</Label>
                    <Input
                      type="date"
                      value={newAppointment.scheduledDate}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Saat *</Label>
                    <Input
                      type="time"
                      value={newAppointment.scheduledTime}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    placeholder="Randevu ile ilgili notlar..."
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleCreateAppointment} 
                  className="w-full"
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
              Tümü ({appointments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Planlandı ({appointments?.filter(a => a.status === 'scheduled')?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Tamamlandı ({appointments?.filter(a => a.status === 'completed')?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              İptal ({appointments?.filter(a => a.status === 'cancelled')?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-6">
            <div className="grid gap-4">
              {filteredAppointments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <i className="fas fa-calendar-times text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-lg text-muted-foreground">Henüz randevu bulunmuyor</p>
                    <p className="text-sm text-muted-foreground">Yeni randevu oluşturmak için yukarıdaki butonu kullanın</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {appointment.customer?.companyName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {appointment.customer?.contactPerson}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getAppointmentTypeBadge(appointment.appointmentType)}
                          {getStatusBadge(appointment.status)}
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

                        {appointment.status === 'scheduled' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAppointmentAction(appointment.id, 'sale_completed', appointment.customerId)}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Satış Yap
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleAppointmentAction(appointment.id, 'follow_up_needed')}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              <i className="fas fa-redo mr-1"></i>
                              Takip Et
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleAppointmentAction(appointment.id, 'not_interested')}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              <i className="fas fa-times mr-1"></i>
                              İlgilenmez
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}