import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Clock, X, Plus } from "lucide-react";
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
  const [formData, setFormData] = useState({
    companyName: customer?.companyName || "",
    contactPerson: customer?.contactPerson || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompleteVisit = (outcome: string) => {
    if (!customer && (!formData.companyName || !formData.contactPerson)) {
      alert("Lütfen en az firma adı ve yetkili kişi bilgilerini girin");
      return;
    }

    if (outcome === 'sale') {
      setShowOrderForm(true);
      return;
    }

    if (outcome === 'follow_up') {
      setShowAppointmentForm(true);
      return;
    }

    // For not_interested, complete directly
    const customerData = customer ? null : {
      ...formData,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
    };

    onComplete(outcome, customerData);
  };

  const handleOrderSubmit = (orderData: any) => {
    const customerData = customer ? null : {
      ...formData,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
    };

    onComplete('sale', customerData, orderData);
  };

  const handleAppointmentSubmit = (appointmentData: any) => {
    const customerData = customer ? null : {
      ...formData,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
    };

    onComplete('follow_up', customerData, null, appointmentData);
  };

  const isNewCustomer = !customer;

  // Show order form if sale is selected
  if (showOrderForm) {
    const customerForOrder = customer || { 
      id: 'new', 
      name: formData.companyName,
      companyName: formData.companyName 
    };
    
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
    const customerForAppointment = customer || { 
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

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => handleCompleteVisit("sale")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-complete-sale"
            >
              <Check className="w-4 h-4 mr-2" />
              Satış Yap
            </Button>
            
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
        </form>
      </CardContent>
    </Card>
  );
}
