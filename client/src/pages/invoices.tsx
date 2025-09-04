import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Building2, Package, CheckCircle, Clock, ShoppingCart, Receipt, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CustomerData {
  customerId: string;
  customer: {
    companyName: string;
    email?: string;
    phone?: string;
  };
  pendingInvoices: any[];
  totalOrders: number;
  totalAmount: number;
}

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  unit: string;
}

interface PendingInvoice {
  orderId: string;
  orderNumber: string;
  totalAmount: string;
  deliveredAt: string;
  notes?: string;
  items: InvoiceItem[];
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [selectedVatRate, setSelectedVatRate] = useState<number>(20); // Varsayılan %20

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: deliveredOrdersByCustomer, isLoading } = useQuery({
    queryKey: ["/api/orders/delivered-by-customer"],
    retry: false,
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices", "all"],
    retry: false,
  });

  // Cari hesap detaylarını getir
  const { data: customerAccountDetails, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/customers", selectedCustomer?.customerId, "account-details"],
    enabled: showAccountDetails && !!selectedCustomer?.customerId,
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
    setShowAccountDetails(false); // İlk önce özet görünümü
  };

  // Toplu faturalaştır butonuna tıklandığında cari hesap sayfasını aç
  const openAccountDetails = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowAccountDetails(true);
    setSelectedInvoices([]);
  };

  // İrsaliye seçimi toggle
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Toplu faturalaştırma mutation - seçilen irsaliyeler için
  const bulkInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer || selectedInvoices.length === 0) {
        throw new Error('Lütfen en az bir irsaliye seçin');
      }
      
      // Seçilen irsaliyelerdeki ürünleri grupla
      const selectedOrders = customerAccountDetails?.pendingInvoices?.filter(
        (invoice: any) => selectedInvoices.includes(invoice.orderId)
      ) || [];
      
      // Ürün bazında gruplama yapmak için API'ye gönder
      return await apiRequest('POST', '/api/invoices/bulk-smart', {
        customerId: selectedCustomer.customerId,
        orderIds: selectedInvoices,
        selectedOrders: selectedOrders,
        vatRate: selectedVatRate
      });
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Toplu Fatura Oluşturuldu!",
        description: `Fatura No: ${data.invoiceNumber} - ${data.orderCount} sipariş birleştirildi`,
      });
      
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/orders/delivered-by-customer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Faturalama Hatası",
        description: error.message || "Toplu fatura oluşturulamadı",
        variant: "destructive",
      });
    }
  });

  // Toplu faturalaştır butonuna tıklama - cari hesap sayfasını aç
  const handleBulkInvoice = (customer: CustomerData) => {
    console.log("Cari hesap sayfası açılıyor:", customer.customer.companyName);
    openAccountDetails(customer);
  };

  // Seçilen irsaliyeleri faturala
  const processSelectedInvoices = () => {
    console.log("Seçilen irsaliyeler faturalaştırılıyor:", selectedInvoices);
    bulkInvoiceMutation.mutate();
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
                          
                          {/* Bekleyen İrsaliyeler (Faturalanmamış) */}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs">
                            <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium">Bekleyen İrsaliyeler</span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold">{customer.pendingInvoices?.length || customer.totalOrders} adet</span>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="font-semibold">{formatCurrency(customer.totalAmount)}</span>
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

          {/* Sağ Panel - Cari Hesap veya Özet */}
          <div className="lg:col-span-2">
            {showAccountDetails && selectedCustomer ? (
              /* CARİ HESAP DETAY SAYFASI */
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAccountDetails(false)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {selectedCustomer.customer?.companyName} - Cari Hesap
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* KDV Oranı Seçimi */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">KDV:</label>
                        <select 
                          value={selectedVatRate}
                          onChange={(e) => setSelectedVatRate(Number(e.target.value))}
                          className="px-2 py-1 border rounded text-sm bg-background"
                        >
                          <option value={1}>%1</option>
                          <option value={5}>%5</option>
                          <option value={10}>%10</option>
                          <option value={20}>%20</option>
                        </select>
                      </div>
                      
                      {selectedInvoices.length > 0 && (
                        <Button 
                          onClick={processSelectedInvoices}
                          disabled={bulkInvoiceMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {bulkInvoiceMutation.isPending ? "Faturalaştırılıyor..." : `${selectedInvoices.length} İrsaliyeyi Faturalaştır`}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SOL - Bekleyen İrsaliyeler */}
                    <div>
                      <h3 className="font-semibold mb-4 text-yellow-700">Bekleyen İrsaliyeler</h3>
                      {accountLoading ? (
                        <div className="text-center py-8">Yükleniyor...</div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {customerAccountDetails?.pendingInvoices?.map((invoice: any) => (
                            <div key={invoice.orderId} className="border rounded p-3 hover:bg-muted/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Checkbox 
                                  checked={selectedInvoices.includes(invoice.orderId)}
                                  onCheckedChange={() => toggleInvoiceSelection(invoice.orderId)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{invoice.orderNumber}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(invoice.deliveredAt)} • {formatCurrency(parseFloat(invoice.totalAmount))}
                                  </div>
                                </div>
                              </div>
                              {/* Ürün Listesi */}
                              <div className="ml-6 space-y-1">
                                {invoice.items?.map((item: InvoiceItem) => (
                                  <div key={item.id} className="text-xs text-muted-foreground">
                                    {item.quantity} {item.unit} {item.productName} - {formatCurrency(parseFloat(item.totalPrice))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SAĞ - Kesilmiş Faturalar */}
                    <div>
                      <h3 className="font-semibold mb-4 text-green-700">Kesilmiş Faturalar</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {customerAccountDetails?.existingInvoices?.length > 0 ? (
                          customerAccountDetails.existingInvoices.map((invoice: any) => (
                            <div key={invoice.id} className="border rounded p-3 bg-green-50 dark:bg-green-900/20">
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(invoice.createdAt)}
                              </div>
                              <div className="text-sm mt-2">
                                <Badge variant="outline" className="text-green-700">
                                  {invoice.status}
                                </Badge>
                              </div>
                              {invoice.notes && (
                                <div className="text-xs text-muted-foreground mt-2 p-2 bg-white dark:bg-gray-800 rounded">
                                  {invoice.notes}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Henüz kesilmiş fatura yok</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedCustomer ? (
              /* ÖZET SAYFASI */
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {selectedCustomer.customer?.companyName} - Cari Hesap
                    </CardTitle>
                    <Button 
                      onClick={() => handleBulkInvoice(selectedCustomer)}
                      disabled={bulkInvoiceMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {bulkInvoiceMutation.isPending ? "Faturalaştırılıyor..." : "Toplu Faturalaştır"}
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
                      {customerAccountDetails?.pendingInvoices?.map((order: any) => (
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
              /* TÜM FATURALAR LİSTESİ */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Tüm Faturalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoices && invoices.length > 0 ? (
                      invoices.map((invoice: any) => (
                        <div key={invoice.id} className="border rounded p-4 hover:bg-muted/50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-lg">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(invoice.createdAt)}
                              </div>
                              <div className="mt-2">
                                <Badge variant="outline" className={
                                  invoice.status === 'generated' ? 'text-green-700' : 'text-blue-700'
                                }>
                                  {invoice.status === 'generated' ? 'Oluşturuldu' : invoice.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Müşteri</div>
                              <div className="font-medium">{invoice.customer?.companyName || 'Bilinmiyor'}</div>
                            </div>
                          </div>
                          
                          {invoice.notes && (
                            <div className="mt-3 p-3 bg-muted/30 rounded text-sm">
                              <div className="font-medium mb-1">Detaylar:</div>
                              {invoice.notes}
                            </div>
                          )}
                          
                          {invoice.shippingAddress && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <strong>Teslimat:</strong> {invoice.shippingAddress}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">Henüz fatura oluşturulmamış</p>
                        <p>Sol panelden firma seçip "Toplu Faturalaştır" butonuna tıklayarak fatura oluşturabilirsiniz.</p>
                      </div>
                    )}
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