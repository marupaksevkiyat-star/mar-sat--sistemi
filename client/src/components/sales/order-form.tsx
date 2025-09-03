import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OrderFormProps {
  customer: any;
  onSubmit: (orderData: any) => void;
  onCancel: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function OrderForm({ customer, onSubmit, onCancel }: OrderFormProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: "", productName: "", quantity: 1, unitPrice: 0 }
  ]);
  const [notes, setNotes] = useState("");

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is selected, auto-fill name and price
    if (field === 'productId' && products) {
      const product = (products as any[]).find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.price || 0;
      }
    }
    
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = () => {
    const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
    
    if (validItems.length === 0) {
      alert("Lütfen en az bir ürün seçin");
      return;
    }

    // Server formatına uygun items hazırla
    const formattedItems = validItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.quantity * item.unitPrice).toString()
    }));

    const orderData = {
      customerId: customer.id,
      notes,
      items: formattedItems,
      totalAmount: calculateTotal().toString(),
      status: 'pending'
    };

    onSubmit(orderData);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Yeni Sipariş - {customer.name || customer.companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Ürün {index + 1}</h4>
              {orderItems.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOrderItem(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Ürün</Label>
                <Select
                  value={item.productId}
                  onValueChange={(value) => updateOrderItem(index, 'productId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {products && (products as any[]).map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ₺{product.price?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Miktar</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label>Birim Fiyat (₺)</Label>
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            {item.productId && (
              <div className="text-right text-sm font-medium">
                Toplam: ₺{(item.quantity * item.unitPrice).toLocaleString()}
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addOrderItem}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ürün Ekle
        </Button>

        <div>
          <Label htmlFor="orderNotes">Sipariş Notları</Label>
          <textarea
            id="orderNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Sipariş ile ilgili özel notlar..."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Toplam Tutar:</span>
            <span>₺{calculateTotal().toLocaleString()}</span>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={orderItems.every(item => !item.productId)}
          >
            <Check className="w-4 h-4 mr-2" />
            Siparişi Onayla
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
          >
            İptal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}