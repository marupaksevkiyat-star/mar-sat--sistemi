import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Clock, X, Plus, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppointmentForm from "./appointment-form";
import OrderForm from "./order-form";

interface CustomerFormProps {
  customer?: any;
  onComplete: (outcome: string, customerData?: any, orderData?: any, appointmentData?: any) => void;
  onCancel: () => void;
  currentLocation?: { lat: number; lng: number } | null;
}

export default function CustomerForm({
  customer,
  onComplete,
  onCancel,
  currentLocation,
}: CustomerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    companyName: customer?.companyName || "",
    contactPerson: customer?.contactPerson || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [savedCustomer, setSavedCustomer] = useState(customer);
  const [isCustomerSaved, setIsCustomerSaved] = useState(!!customer);

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Raw API Response:', result);
      return result;
    },
    onSuccess: (newCustomer: any) => {
      console.log('✅ Customer saved response:', newCustomer);
      // Check if response has the customer data properly
      const customerData = newCustomer?.customer || newCustomer;
      console.log('✅ Processed customer data:', customerData);
      
      setSavedCustomer(customerData);
      setIsCustomerSaved(true);
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla kaydedildi. Ne yapmak istiyorsunuz?",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Don't close automatically - let user choose what to do next
    },
    onError: (error) => {
      console.error("Müşteri kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: "Müşteri kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // If user changes data after saving, mark as not saved
    if (isCustomerSaved && !customer) {
      setIsCustomerSaved(false);
    }
  };

  const handleSaveCustomer = () => {
    if (!formData.companyName || !formData.contactPerson) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen en az firma adı ve yetkili kişi bilgilerini girin",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      ...formData,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
      status: 'active',
    };

    createCustomerMutation.mutate(customerData);
  };

  const handleCompleteVisit = async (outcome: string) => {
    // Check if customer is saved for new customers
    if (!customer && !isCustomerSaved) {
      toast({
        title: "Müşteri Kaydı Gerekli",
        description: "Önce müşteriyi kaydedin, sonra işlem yapabilirsiniz",
        variant: "destructive",
      });
      return;
    }

    // Sale işlemi kaldırıldı - kullanıcı sağ taraftaki karttan sipariş verecek

    if (outcome === 'follow_up') {
      setShowAppointmentForm(true);
      return;
    }

    // For not_interested, update customer status to inactive
    if (outcome === 'not_interested') {
      const customerToUpdate = customer || savedCustomer;
      if (customerToUpdate && customerToUpdate.id) {
        try {
          // Update customer status to inactive
          const response = await fetch(`/api/customers/${customerToUpdate.id}/deactivate`, {
            method: 'PATCH',
          });
          
          if (response.ok) {
            toast({
              title: "Müşteri Durumu Güncellendi",
              description: "Müşteri ilgilenmiyor olarak işaretlendi ve pasife alındı",
            });
          }
        } catch (error) {
          console.error('Error updating customer status:', error);
          toast({
            title: "Uyarı",
            description: "Müşteri durumu güncellenemedi, ancak ziyaret kaydedildi",
            variant: "destructive",
          });
        }
      }
    }

    // For not_interested, use saved customer if available
    const customerData = (customer || savedCustomer) ? null : {
      ...formData,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
    };

    onComplete(outcome, customerData);
  };

  const handleOrderSubmit = (orderData: any) => {
    const customerToUse = savedCustomer || customer;
    console.log('📤 HandleOrderSubmit - customerToUse:', customerToUse);
    
    // Use the saved customer data instead of creating new one
    if (customerToUse && customerToUse.id && customerToUse.id !== 'new') {
      // We have a real saved customer, just create the order
      console.log('📤 Submitting order with customerId:', customerToUse.id);
      onComplete('sale', null, { ...orderData, customerId: customerToUse.id });
    } else {
      console.error('❌ No valid customer found for order');
      toast({
        title: "Hata",
        description: "Müşteri bilgisi bulunamadı. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      });
    }
  };

  const handleAppointmentSubmit = (appointmentData: any) => {
    const customerToUse = savedCustomer || customer;
    console.log('📅 HandleAppointmentSubmit - customerToUse:', customerToUse);
    
    // Use the saved customer data instead of creating new one
    if (customerToUse && customerToUse.id && customerToUse.id !== 'new') {
      // We have a real saved customer, just create the appointment
      console.log('📅 Submitting appointment with customerId:', customerToUse.id);
      onComplete('follow_up', null, null, { ...appointmentData, customerId: customerToUse.id });
    } else {
      console.error('❌ No valid customer found for appointment');
      toast({
        title: "Hata",
        description: "Müşteri bilgisi bulunamadı. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      });
    }
  };

  const isNewCustomer = !customer;

  // Show order form if sale is selected
  if (showOrderForm) {
    // Use saved customer if available, otherwise the passed customer
    const customerForOrder = savedCustomer || customer || { 
      id: 'new', 
      name: formData.companyName,
      companyName: formData.companyName 
    };

    console.log('🏷️ CustomerForm - Customer for order:', customerForOrder);
    
    return (
      <OrderForm
        customer={customerForOrder}
        onSubmit={handleOrderSubmit}
        onCancel={() => setShowOrderForm(false)}
      />
    );
  }

  // Show appointment form if follow-up is selected
  if (showAppointmentForm) {
    const customerForAppointment = customer || savedCustomer || { 
      id: 'new', 
      name: formData.companyName,
      companyName: formData.companyName 
    };
    
    return (
      <AppointmentForm
        customer={customerForAppointment}
        onSubmit={handleAppointmentSubmit}
        onCancel={() => setShowAppointmentForm(false)}
      />
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          {isNewCustomer ? "Yeni Müşteri Bilgileri" : "Müşteri Bilgileri"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Firma Adı *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Firma adını girin"
                disabled={!isNewCustomer}
                data-testid="input-company-name"
              />
            </div>
            
            <div>
              <Label htmlFor="contactPerson">Yetkili Kişi *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                placeholder="İletişim kişisi"
                disabled={!isNewCustomer}
                data-testid="input-contact-person"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                disabled={!isNewCustomer}
                data-testid="input-phone"
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="eposta@firma.com"
                disabled={!isNewCustomer}
                data-testid="input-email"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Müşteri adresi (GPS'ten otomatik doldurulur)"
              rows={3}
              disabled={!isNewCustomer}
              data-testid="textarea-address"
            />
          </div>

          {currentLocation && isNewCustomer && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <i className="fas fa-map-marker-alt mr-2"></i>
                GPS Koordinatları: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Save Customer Button - Only for new customers */}
          {isNewCustomer && !isCustomerSaved && (
            <div className="border-t pt-4">
              <Button
                type="button"
                onClick={handleSaveCustomer}
                disabled={createCustomerMutation.isPending}
                className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-save-customer"
              >
                {createCustomerMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Müşteriyi Kaydet
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Müşteri kaydedildikten sonra seçenekler */}
          {isNewCustomer && isCustomerSaved && (
            <div className="border-t pt-4 space-y-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-green-700 font-medium">Müşteri başarıyla kaydedildi!</p>
                <p className="text-xs text-green-600">Devamında ne yapmak istiyorsunuz?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setShowOrderForm(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  data-testid="button-create-order"
                >
                  <i className="fas fa-shopping-cart w-4 h-4 mr-2"></i>
                  Satış Yap
                </Button>
                
                <Button
                  type="button"
                  onClick={() => handleCompleteVisit("follow_up")}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="button-schedule-follow-up"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Randevu Ver
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleCompleteVisit("not_interested")}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                  data-testid="button-not-interested"
                >
                  <X className="w-4 h-4 mr-2" />
                  İlgilenmiyor
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="button-close"
                >
                  <i className="fas fa-times w-4 h-4 mr-2"></i>
                  Kapat
                </Button>
              </div>
            </div>
          )}

          {/* Sadece mevcut müşteriler için ziyaret sonucu butonları */}
          {customer && (
            <>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={() => handleCompleteVisit("follow_up")}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  data-testid="button-schedule-follow-up"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Takip Et
                </Button>
                
                <Button
                  type="button"
                  onClick={() => handleCompleteVisit("not_interested")}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                  data-testid="button-not-interested"
                >
                  <X className="w-4 h-4 mr-2" />
                  İlgilenmiyor
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full mt-4"
                data-testid="button-cancel"
              >
                İptal
              </Button>
            </>
          )}

          {/* Yeni müşteri için henüz kaydedilmemişse sadece iptal */}
          {!customer && !isCustomerSaved && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full mt-4"
              data-testid="button-cancel"
            >
              İptal
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
