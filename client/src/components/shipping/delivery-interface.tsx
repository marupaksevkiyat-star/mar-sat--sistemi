import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Truck, MapPin, Clock } from "lucide-react";
import SignaturePad from "./signature-pad";

interface DeliveryInterfaceProps {
  activeDelivery: any;
  onCompleteDelivery: (recipient: string, signature?: string) => void;
}

export default function DeliveryInterface({
  activeDelivery,
  onCompleteDelivery,
}: DeliveryInterfaceProps) {
  const [recipient, setRecipient] = useState("");
  const [signature, setSignature] = useState<string | undefined>();

  const handleComplete = () => {
    if (!recipient.trim()) {
      alert("Lütfen teslim alan kişinin adını girin");
      return;
    }
    onCompleteDelivery(recipient, signature);
    setRecipient("");
    setSignature(undefined);
  };

  if (!activeDelivery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobil Teslimat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground mb-2">Aktif Teslimat Yok</h4>
            <p className="text-sm text-muted-foreground">
              Teslimat başlatmak için sevkiyata hazır siparişlerden birini seçin
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock delivery progress and ETA
  const deliveryProgress = 65;
  const estimatedTime = "25 dakika";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobil Teslimat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center">
          <Truck className="w-16 h-16 text-primary mx-auto mb-4" />
          <h4 className="font-medium text-foreground mb-2">Aktif Teslimat</h4>
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-delivery-destination">
            {activeDelivery.customer?.companyName} - {activeDelivery.customer?.address}
          </p>
          
          {/* Teslim Edilecek Ürünler */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <h5 className="font-medium text-foreground mb-3 flex items-center">
              <i className="fas fa-box mr-2"></i>
              Teslim Edilecek Ürünler
            </h5>
            <div className="space-y-2">
              {activeDelivery.items && activeDelivery.items.length > 0 ? (
                activeDelivery.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-background rounded border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">
                        {item.product?.name || item.productName || 'Bilinmeyen Ürün'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.product?.description || item.notes || ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-foreground">
                        {item.quantity} {item.unit || 'adet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.unitPrice ? `${parseFloat(item.unitPrice).toFixed(2)} TL` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Ürün bilgileri yüklenemedi
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-foreground">
                  Toplam Tutar:
                </span>
                <span className="font-bold text-foreground">
                  {activeDelivery.totalAmount ? `${parseFloat(activeDelivery.totalAmount).toFixed(2)} TL` : 'Hesaplanıyor...'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation Progress */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tahmini Varış</span>
              </div>
              <span className="font-medium text-foreground" data-testid="text-estimated-time">
                {estimatedTime}
              </span>
            </div>
            <Progress value={deliveryProgress} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                {deliveryProgress}% tamamlandı
              </span>
            </div>
          </div>
          
          {/* Digital Signature Area */}
          <div className="border border-border rounded-lg p-4 mb-4">
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Dijital İmza
            </Label>
            <SignaturePad onSignatureChange={setSignature} />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="recipient" className="text-sm font-medium text-foreground">
              Teslim Alan Kişi *
            </Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="İsim Soyisim"
              className="mt-1"
              data-testid="input-delivery-recipient"
            />
          </div>
          
          <Button
            onClick={handleComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={!recipient.trim()}
            data-testid="button-complete-delivery"
          >
            <Truck className="w-4 h-4 mr-2" />
            Teslimatı Tamamla
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
