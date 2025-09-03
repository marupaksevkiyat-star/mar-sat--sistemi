import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Play, Save, Check, Eye } from "lucide-react";

interface OrderCardProps {
  order: any;
  mode: "pending" | "edit" | "view";
  onStartProduction?: (orderId: string) => void;
  onUpdateProduction?: (orderId: string, items: any[], notes?: string) => void;
  onCompleteProduction?: (orderId: string) => void;
}

export default function OrderCard({
  order,
  mode,
  onStartProduction,
  onUpdateProduction,
  onCompleteProduction,
}: OrderCardProps) {
  const [items, setItems] = useState(order.items || []);
  const [notes, setNotes] = useState(order.productionNotes || "");

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Bekliyor", className: "status-pending" },
      production: { label: "Üretimde", className: "status-production" },
      production_ready: { label: "Sevkiyata Hazır", className: "status-ready" },
      shipping: { label: "Sevkiyatta", className: "status-shipping" },
      delivered: { label: "Teslim Edildi", className: "status-delivered" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      totalPrice: quantity * parseFloat(updatedItems[index].unitPrice),
    };
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice || 0), 0);
  };

  const handleUpdate = () => {
    if (onUpdateProduction) {
      onUpdateProduction(order.id, items, notes);
    }
  };

  const handleComplete = () => {
    if (onCompleteProduction) {
      onCompleteProduction(order.id);
    }
  };

  const handleStart = () => {
    if (onStartProduction) {
      onStartProduction(order.id);
    }
  };

  if (mode === "edit") {
    return (
      <Card className="shadow-sm" data-testid={`order-card-${order.id}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {order.orderNumber} - Üretimde
              </h4>
              <p className="text-sm text-muted-foreground">
                {order.customer?.companyName}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-foreground mb-3">Sipariş Detayları</h5>
              <div className="space-y-3">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex-1">
                      {item.product?.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center"
                        min="0"
                        data-testid={`input-quantity-${index}`}
                      />
                      <span className="text-foreground text-xs">
                        {item.product?.unit || 'Adet'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">Toplam Tutar</span>
                  <span className="text-foreground" data-testid="text-calculated-total">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-foreground mb-3">Üretim Notları</h5>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Üretim sürecine özel notlar..."
                data-testid="textarea-production-notes"
              />
              
              <div className="mt-4 flex space-x-3">
                <Button
                  onClick={handleUpdate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-update-production"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Güncelle
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-complete-production"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Tamamla
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow" data-testid={`order-card-${order.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-foreground" data-testid={`order-number-${order.id}`}>
              {order.orderNumber}
            </h4>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
        
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-sm font-medium text-foreground">Müşteri</p>
            <p className="text-sm text-muted-foreground" data-testid={`customer-name-${order.id}`}>
              {order.customer?.companyName}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">Ürünler</p>
            <div className="text-sm text-muted-foreground">
              {order.items?.map((item: any, index: number) => (
                <div key={index} data-testid={`product-${order.id}-${index}`}>
                  • {item.product?.name} - {item.quantity} {item.product?.unit || 'Adet'}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">Toplam Tutar</p>
            <p className="text-lg font-bold text-foreground" data-testid={`total-amount-${order.id}`}>
              {formatCurrency(parseFloat(order.totalAmount || '0'))}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {mode === "pending" && (
            <Button
              onClick={handleStart}
              className="w-full"
              data-testid={`button-start-production-${order.id}`}
            >
              <Play className="w-4 h-4 mr-2" />
              Üretime Başla
            </Button>
          )}
          <Button
            variant="secondary"
            className="w-full"
            data-testid={`button-view-details-${order.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Detayları Görüntüle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
