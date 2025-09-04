import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Building2, Package, CheckCircle, Clock, ShoppingCart, Receipt } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CustomerData {
  customerId: string;
  customer: {
    companyName: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  orders: any[];
  totalOrders: number;
  totalAmount: number;
  products: Record<string, any>;
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const queryClient = useQueryClient();

  const { data: deliveredOrdersByCustomer, isLoading } = useQuery({
    queryKey: ["/api/test-delivered-orders"],
    retry: false,
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices", "all"],
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Müşteri tıklandığında cari hesap detaylarını göster
  const handleCustomerClick = (customer: CustomerData) => {
    setSelectedCustomer(customer);
  };

  // Toplu faturalaştırma
  const handleBulkInvoice = (customer: CustomerData) => {
    // Bu fonksiyon birden fazla irsaliyeyi tek faturada birleştirip
    // fatura numarası ve fatura görseli oluşturacak
    console.log("Toplu faturalaştırma:", customer);
  };

  const filteredCustomers = Array.isArray(deliveredOrdersByCustomer) 
    ? deliveredOrdersByCustomer.filter((customer: CustomerData) => {
        const companyName = customer.customer?.companyName?.toLowerCase() || '';
        return companyName.includes(searchTerm.toLowerCase());
      })
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Muhasebe Yönetimi</h2>
            <p className="text-muted-foreground mt-1">Firma bazında irsaliye ve fatura işlemleri</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Panel - Firma Listesi */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Firmalar
                </CardTitle>
                
                {/* Arama */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Firma ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Teslim edilmiş irsaliye bulunamadı
                    </div>
                  ) : (
                    filteredCustomers.map((customer: CustomerData) => (
                      <div 
                        key={customer.customerId} 
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedCustomer?.customerId === customer.customerId ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        {/* Firma Bilgileri */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">{customer.customer?.companyName}</h3>
                          
                          {/* Teslim Edilmiş İrsaliyeler */}
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                              <CheckCircle className="w-3 h-3" />
                              <span className="font-medium">Teslim Edilmiş İrsaliyeler</span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold">{customer.totalOrders} adet</span>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="font-semibold">{formatCurrency(customer.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Bekleyen İrsaliyeler - Şimdilik placeholder */}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium">Bekleyen İrsaliyeler</span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold">0 adet</span>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="font-semibold">{formatCurrency(0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Panel - Seçili Firma Detayları */}
          <div className="lg:col-span-2">
            {selectedCustomer ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {selectedCustomer.customer?.companyName} - Cari Hesap
                    </CardTitle>
                    <Button 
                      onClick={() => handleBulkInvoice(selectedCustomer)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Toplu Faturalaştır
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Özet Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                            <p className="font-semibold">{selectedCustomer.totalOrders} adet</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                            <p className="font-semibold">{formatCurrency(selectedCustomer.totalAmount)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Ürün Çeşidi</p>
                            <p className="font-semibold">{Object.keys(selectedCustomer.products || {}).length} çeşit</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Ürün Detayları */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Toplam Ürünler:</h4>
                    <div className="space-y-2">
                      {Object.values(selectedCustomer.products || {}).map((productData: any) => (
                        <div key={productData.product?.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{productData.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {productData.deliveries?.length || 0} teslimat
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{productData.totalQuantity} adet</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(productData.totalPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* İrsaliye Detayları */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">İrsaliye Detayları:</h4>
                    <div className="space-y-2">
                      {selectedCustomer.orders.map((order: any) => (
                        <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.deliveredAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-600">
                              Teslim Edildi
                            </Badge>
                            <p className="text-sm font-semibold mt-1">
                              {formatCurrency(parseFloat(order.totalAmount || '0'))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Cari hesap detaylarını görmek için soldan bir firma seçin
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}