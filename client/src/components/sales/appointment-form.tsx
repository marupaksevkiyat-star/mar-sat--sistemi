import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";

interface AppointmentFormProps {
  customer: any;
  onSubmit: (appointmentData: any) => void;
  onCancel: () => void;
}

export default function AppointmentForm({ customer, onSubmit, onCancel }: AppointmentFormProps) {
  const [appointmentData, setAppointmentData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    title: "",
    notes: "",
  });

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleInputChange = (field: string, value: string) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!appointmentData.scheduledDate || !appointmentData.scheduledTime) {
      alert("Lütfen randevu tarih ve saatini seçin");
      return;
    }

    const scheduledDateTime = new Date(`${appointmentData.scheduledDate}T${appointmentData.scheduledTime}`);
    
    const appointment = {
      customerId: customer.id,
      scheduledDate: scheduledDateTime.toISOString(),
      title: appointmentData.title || `${customer.name || customer.companyName} ile takip randevusu`,
      notes: appointmentData.notes,
      status: "scheduled"
    };

    onSubmit(appointment);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Takip Randevusu Planla
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {customer.name || customer.companyName} için randevu planlayın
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="appointmentDate">Randevu Tarihi</Label>
            <Input
              id="appointmentDate"
              type="date"
              min={minDate}
              value={appointmentData.scheduledDate}
              onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
              data-testid="input-appointment-date"
            />
          </div>
          
          <div>
            <Label htmlFor="appointmentTime">Randevu Saati</Label>
            <Input
              id="appointmentTime"
              type="time"
              value={appointmentData.scheduledTime}
              onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
              data-testid="input-appointment-time"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="appointmentTitle">Randevu Başlığı</Label>
          <Input
            id="appointmentTitle"
            value={appointmentData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder={`${customer.name || customer.companyName} ile takip randevusu`}
            data-testid="input-appointment-title"
          />
        </div>

        <div>
          <Label htmlFor="appointmentNotes">Randevu Notları</Label>
          <Textarea
            id="appointmentNotes"
            value={appointmentData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Randevu ile ilgili özel notlar, konuşulacak konular..."
            rows={4}
            data-testid="textarea-appointment-notes"
          />
        </div>

        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            Randevu tarihi geldiğinde size hatırlatma yapılacaktır
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            disabled={!appointmentData.scheduledDate || !appointmentData.scheduledTime}
            data-testid="button-schedule-appointment"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Randevuyu Planla
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-appointment"
          >
            İptal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}