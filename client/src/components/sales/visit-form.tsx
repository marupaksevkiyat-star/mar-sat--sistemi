import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface VisitFormProps {
  onSubmit: (visitData: any) => void;
  onCancel: () => void;
  customer?: any;
  currentLocation?: { lat: number; lng: number } | null;
}

export default function VisitForm({
  onSubmit,
  onCancel,
  customer,
  currentLocation,
}: VisitFormProps) {
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<string>("");

  const handleSubmit = () => {
    if (!outcome) {
      alert("Lütfen ziyaret sonucunu seçin");
      return;
    }

    const visitData = {
      customerId: customer?.id,
      visitType: customer ? 'existing_customer' : 'new_customer',
      outcome,
      notes,
      latitude: currentLocation?.lat?.toString(),
      longitude: currentLocation?.lng?.toString(),
    };

    onSubmit(visitData);
  };

  const outcomeOptions = [
    { value: "sale", label: "Satış Yapıldı", color: "bg-green-100 text-green-800" },
    { value: "follow_up", label: "Takip Gerekli", color: "bg-orange-100 text-orange-800" },
    { value: "not_interested", label: "İlgilenmiyor", color: "bg-gray-100 text-gray-800" },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ziyaret Sonucu</CardTitle>
        {customer && (
          <div className="text-sm text-muted-foreground">
            {customer.companyName}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium">Ziyaret Sonucu</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {outcomeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setOutcome(option.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  outcome === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent/50"
                }`}
                data-testid={`option-outcome-${option.value}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.label}</span>
                  <Badge className={option.color}>{option.label}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Ziyaret Notları</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ziyaret hakkında notlarınızı yazın..."
            rows={4}
            data-testid="textarea-visit-notes"
          />
        </div>

        {currentLocation && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <i className="fas fa-map-marker-alt mr-2"></i>
              Ziyaret Konumu: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!outcome}
            className="flex-1"
            data-testid="button-submit-visit"
          >
            Ziyareti Kaydet
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-visit"
          >
            İptal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
