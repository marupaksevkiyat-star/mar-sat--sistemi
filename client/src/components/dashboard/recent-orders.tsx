import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentOrdersProps {
  orders: any[];
  isLoading?: boolean;
}

export default function RecentOrders({ orders, isLoading = false }: RecentOrdersProps) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Son Siparişler</CardTitle>
            <Skeleton className="h-4 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Son Siparişler</CardTitle>
          <Button variant="link" size="sm" data-testid="button-view-all-orders">
            Tümünü Gör
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-shopping-cart text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">Henüz sipariş bulunmamaktadır</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`order-${order.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-secondary-foreground"></i>
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid={`order-customer-${order.id}`}>
                      {order.customer?.companyName || 'Bilinmeyen Müşteri'}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`order-items-${order.id}`}>
                      {order.items?.length ? 
                        `${order.items[0].product?.name} - ${order.items[0].quantity} ${order.items[0].product?.unit || 'Adet'}${order.items.length > 1 ? ` (+${order.items.length - 1} daha)` : ''}` :
                        'Ürün bilgisi yok'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground" data-testid={`order-amount-${order.id}`}>
                    {formatCurrency(parseFloat(order.totalAmount || '0'))}
                  </p>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
