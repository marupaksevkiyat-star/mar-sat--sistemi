import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X, Save } from "lucide-react";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selected: boolean;
}

export default function OrderModal({ isOpen, onClose, customer }: OrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({});

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    enabled: isOpen,
    retry: false,
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
      onClose();
      setOrderItems({});
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

  useEffect(() => {
    if (products && Object.keys(orderItems).length === 0) {
      const initialItems: Record<string, OrderItem> = {};
      products.forEach((product: any) => {
        initialItems[product.id] = {
          productId: product.id,
          quantity: 1,
          unitPrice: parseFloat(product.price),
          totalPrice: parseFloat(product.price),
          selected: false,
        };
      });
      setOrderItems(initialItems);
    }
  }, [products, orderItems]);

  const handleProductToggle = (productId: string, checked: boolean) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: checked,
      },
    }));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, quantity),
        totalPrice: Math.max(1, quantity) * prev[productId].unitPrice,
      },
    }));
  };

  const getSelectedItems = () => {
    return Object.values(orderItems).filter(item => item.selected);
  };

  const calculateSubtotal = () => {
    return getSelectedItems().reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% KDV
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir ürün seçin",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      order: {
        customerId: customer.id,
        totalAmount: calculateTotal(),
        taxAmount: calculateTax(),
        deliveryAddress: customer.address,
      },
      items: selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const selectedCount = getSelectedItems().length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-order">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Yeni Sipariş</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Müşteri Bilgileri</h4>
            <p className="text-sm text-muted-foreground" data-testid="text-customer-name">
              {customer?.companyName}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-customer-address">
              {customer?.address}
            </p>
          </div>
          
          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Ürün Seçimi</h4>
              <Badge variant="secondary">
                {selectedCount} ürün seçildi
              </Badge>
            </div>
            
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                    <div className="w-5 h-5 bg-muted rounded animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
                    </div>
                    <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products?.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`product-${product.id}`}
                  >
                    <Checkbox
                      checked={orderItems[product.id]?.selected || false}
                      onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                      data-testid={`checkbox-product-${product.id}`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(product.price))} / {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`quantity-${product.id}`} className="sr-only">
                        Miktar
                      </Label>
                      <Input
                        id={`quantity-${product.id}`}
                        type="number"
                        min="1"
                        value={orderItems[product.id]?.quantity || 1}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        disabled={!orderItems[product.id]?.selected}
                        data-testid={`input-quantity-${product.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Sipariş Özeti</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="text-foreground" data-testid="text-subtotal">
                  {formatCurrency(calculateSubtotal())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KDV (%18)</span>
                <span className="text-foreground" data-testid="text-tax">
                  {formatCurrency(calculateTax())}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Toplam</span>
                <span className="text-foreground" data-testid="text-total">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-order"
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedCount === 0 || createOrderMutation.isPending}
              className="flex-1"
              data-testid="button-submit-order"
            >
              <Save className="w-4 h-4 mr-2" />
              {createOrderMutation.isPending ? "Kaydediliyor..." : "Siparişi Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
