import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import LocationTracker from "@/components/sales/location-tracker";
import VisitForm from "@/components/sales/visit-form";
import CustomerForm from "@/components/sales/customer-form";
import DailyAppointments from "@/components/sales/daily-appointments";
import DailyVisits from "@/components/sales/daily-visits";
import OrderForm from "@/components/sales/order-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export default function Sales() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCustomerForSale, setSelectedCustomerForSale] = useState<any>(null);

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

  const { data: nearbyCustomers, isLoading: nearbyLoading } = useQuery({
    queryKey: ["/api/customers/nearby", currentLocation?.lat, currentLocation?.lng],
    enabled: !!currentLocation,
    retry: false,
  });

  const { data: allCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  const { data: dailyStats } = useQuery({
    queryKey: ["/api/visits", new Date().toISOString().split('T')[0]],
    retry: false,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      return await apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowCustomerForm(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Hata",
        description: "Müşteri oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Sipariş başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Hata",
        description: "Sipariş oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      return await apiRequest("POST", "/api/appointments", appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla planlandı",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: async (visitData: any) => {
      return await apiRequest("POST", "/api/visits", visitData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ziyaret kaydedildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/visits"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Hata",
        description: "Ziyaret kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    },
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

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setShowCustomerForm(true);
  };

  const handleNewSale = (customer: any) => {
    setSelectedCustomerForSale(customer);
  };

  const handleCompleteVisit = (outcome: string, customerData?: any, orderData?: any, appointmentData?: any) => {
    // Create visit record
    const visitData = {
      customerId: selectedCustomer?.id,
      visitType: selectedCustomer ? 'existing_customer' : 'new_customer',
      outcome,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
      notes: `Ziyaret sonucu: ${outcome}`,
    };

    createVisitMutation.mutate(visitData);

    // If creating new customer, handle customer creation first
    if (!selectedCustomer && customerData) {
      const newCustomerData = {
        ...customerData,
        latitude: currentLocation?.lat?.toString(),
        longitude: currentLocation?.lng?.toString(),
        status: outcome === 'not_interested' ? 'not_interested' : 'active',
      };
      
      // If there's order data, we need to create customer first, then order
      if (orderData) {
        createCustomerMutation.mutate(newCustomerData, {
          onSuccess: (newCustomer) => {
            // Create order items first
            const orderItemsData = orderData.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price
            }));
            
            const orderPayload = {
              order: {
                customerId: newCustomer.id,
                notes: orderData.notes || '',
                totalAmount: orderData.totalAmount.toString(),
                status: orderData.status || 'pending'
              },
              items: orderItemsData
            };
            createOrderMutation.mutate(orderPayload);
          }
        });
      } else if (appointmentData) {
        // If there's appointment data, create customer first, then appointment
        createCustomerMutation.mutate(newCustomerData, {
          onSuccess: (newCustomer) => {
            const appointmentWithCustomer = {
              ...appointmentData,
              customerId: newCustomer.id,
            };
            createAppointmentMutation.mutate(appointmentWithCustomer);
          }
        });
      } else {
        createCustomerMutation.mutate(newCustomerData);
      }
    } else if (orderData && selectedCustomer) {
      // Existing customer - just create the order
      const orderItemsData = orderData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      }));
      
      const orderPayload = {
        order: {
          customerId: selectedCustomer.id,
          notes: orderData.notes || '',
          totalAmount: orderData.totalAmount.toString(),
          status: orderData.status || 'pending'
        },
        items: orderItemsData
      };
      createOrderMutation.mutate(orderPayload);
    } else if (appointmentData && selectedCustomer) {
      // Existing customer - just create the appointment
      const appointmentWithCustomer = {
        ...appointmentData,
        customerId: selectedCustomer.id,
      };
      createAppointmentMutation.mutate(appointmentWithCustomer);
    }

    setShowCustomerForm(false);
    setSelectedCustomer(null);
  };

  const calculateTodayStats = () => {
    if (!dailyStats || !Array.isArray(dailyStats)) return { totalVisits: 0, successfulSales: 0, followUps: 0 };
    
    return {
      totalVisits: dailyStats.length,
      successfulSales: dailyStats.filter((v: any) => v.outcome === 'sale').length,
      followUps: dailyStats.filter((v: any) => v.outcome === 'follow_up').length,
    };
  };

  const todayStats = calculateTodayStats();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Satış Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Saha ziyaretleri ve müşteri yönetimi</p>
        </div>

        {/* Ana İki Kart - Yeni Ziyaret ve Yeni Satış */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Yeni Ziyaret */}
          <LocationTracker 
            onLocationUpdate={setCurrentLocation}
            nearbyCustomers={nearbyCustomers}
            onSelectCustomer={handleSelectCustomer}
            onNewCustomer={handleNewCustomer}
            isLoading={nearbyLoading}
          />

          {/* Yeni Satış - Müşteri Seçimi */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Yeni Satış</CardTitle>
              <p className="text-sm text-muted-foreground">Mevcut müşterilere satış yap</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-select">Müşteri Seçin</Label>
                <Select 
                  onValueChange={(customerId) => {
                    const customer = allCustomers?.find((c: any) => c.id === customerId);
                    if (customer) {
                      handleNewSale(customer);
                    }
                  }}
                  disabled={customersLoading || !allCustomers?.length}
                >
                  <SelectTrigger className="w-full" data-testid="select-customer">
                    <SelectValue 
                      placeholder={
                        customersLoading ? "Yükleniyror..." : 
                        !allCustomers?.length ? "Müşteri bulunmuyor" :
                        "Müşteri seçin"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {allCustomers?.map((customer: any) => (
                      <SelectItem 
                        key={customer.id} 
                        value={customer.id}
                        data-testid={`customer-option-${customer.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            customer.status === 'active' ? 'bg-blue-100' : 
                            customer.status === 'potential' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <i className={`fas ${
                              customer.status === 'active' ? 'fa-building text-blue-600' :
                              customer.status === 'potential' ? 'fa-store text-green-600' :
                              'fa-building text-gray-600'
                            } text-xs`}></i>
                          </div>
                          <div>
                            <span className="font-medium">{customer.companyName}</span>
                            <span className="text-muted-foreground text-sm ml-2">({customer.contactPerson})</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!customersLoading && allCustomers?.length === 0 && (
                <div className="text-center py-6 border border-dashed border-border rounded-lg">
                  <i className="fas fa-building text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-sm text-muted-foreground">Henüz müşteri bulunmuyor</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Önce "Yeni Ziyaret" ile müşteri ekleyin
                  </p>
                </div>
              )}

              {/* Sipariş Formu */}
              {selectedCustomerForSale && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground">
                      Sipariş Oluştur: {selectedCustomerForSale.companyName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomerForSale.contactPerson}
                    </p>
                  </div>
                  <OrderForm
                    customer={selectedCustomerForSale}
                    onSubmit={(orderData) => {
                      createOrderMutation.mutate(orderData, {
                        onSuccess: () => {
                          setSelectedCustomerForSale(null);
                        }
                      });
                    }}
                    onCancel={() => {
                      setSelectedCustomerForSale(null);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form'lar */}
        {showCustomerForm && (
          <div className="mb-8">
            <CustomerForm
              customer={selectedCustomer}
              onComplete={handleCompleteVisit}
              onCancel={() => {
                setShowCustomerForm(false);
                setSelectedCustomer(null);
              }}
              currentLocation={currentLocation}
            />
          </div>
        )}


        {/* Diğer Özellikler - Alt Kısım */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Visits */}
          <DailyVisits />
          
          {/* Daily Appointments */}
          <DailyAppointments onStartVisit={handleSelectCustomer} />

          {/* Daily Stats + Map */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bugünkü Aktivite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Toplam Ziyaret</span>
                    <span className="font-medium text-foreground" data-testid="text-total-visits">
                      {todayStats.totalVisits}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Başarılı Satış</span>
                    <span className="font-medium text-green-600" data-testid="text-successful-sales">
                      {todayStats.successfulSales}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Takip Gerekli</span>
                    <span className="font-medium text-orange-600" data-testid="text-follow-ups">
                      {todayStats.followUps}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Konum Haritası</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-map text-4xl text-muted-foreground mb-2"></i>
                    <p className="text-sm text-muted-foreground">Harita Entegrasyonu</p>
                    <p className="text-xs text-muted-foreground mt-1">GPS konumu ve müşteri konumları</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
