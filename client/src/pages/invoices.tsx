import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Search, Truck, Package, CheckCircle, Clock, AlertTriangle, Receipt, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

type InvoiceStatus = 'draft' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customer?: {
    name?: string;
    companyName?: string;
    address?: string;
    phone?: string;
  };
  order?: {
    totalAmount: string;
    status: string;
  };
  status: InvoiceStatus;
  shippingAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'invoices' | 'deliveries'>('deliveries');

  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", statusFilter],
    retry: false,
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders", "ready-for-shipping"],
    retry: false,
  });

  const { data: deliveredOrdersByCustomer } = useQuery({
    queryKey: ["/api/orders/delivered-by-customer"],
    retry: false,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      setShowCreateDialog(false);
      setSelectedOrder("");
      setShippingAddress("");
      setNotes("");
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) => 
      apiRequest("PATCH", `/api/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
    },
  });

  const handleCreateInvoice = () => {
    if (!selectedOrder || !shippingAddress) return;
    
    createInvoiceMutation.mutate({
      orderId: selectedOrder,
      shippingAddress,
      notes,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'outline';
      case 'pending': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'pending': return 'Beklemede';
      case 'shipped': return 'Sevk Edildi';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  const filteredInvoices = (invoices as Invoice[] || []).filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            <p className="text-muted-foreground mt-1">İrsaliye ve fatura işlemleri</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Teslim Edilmiş İrsaliyeler
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Faturalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bazında Teslim Edilmiş Siparişler</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Aynı müşteriye ait irsaliyeleri toplu olarak faturalayabilirsiniz
                </p>
              </CardHeader>
              <CardContent>
                {deliveredOrdersByCustomer?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz teslim edilmiş sipariş bulunmuyor
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(deliveredOrdersByCustomer || []).map((customerData: any) => (
                      <div key={customerData.customerId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{customerData.customer?.companyName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {customerData.totalOrders} adet sipariş • Toplam: {formatCurrency(customerData.totalAmount)}
                            </p>
                          </div>
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Layers className="w-4 h-4 mr-2" />
                            Toplu Faturala
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Toplam Ürünler:</h4>
                          {Object.values(customerData.products || {}).map((productData: any) => (
                            <div key={productData.product?.id} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                              <span>{productData.product?.name}</span>
                              <span className="font-medium">
                                {productData.totalQuantity} adet • {formatCurrency(productData.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <details className="mt-4">
                          <summary className="cursor-pointer text-sm text-primary">İrsaliye Detayları</summary>
                          <div className="mt-2 space-y-1">
                            {customerData.orders.map((order: any) => (
                              <div key={order.id} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                {order.orderNumber} • {formatDate(order.deliveredAt)} • {formatCurrency(order.totalAmount)}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Faturalar</CardTitle>
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni İrsaliye
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni İrsaliye Oluştur</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Sipariş Seç</Label>
                          <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sipariş seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {(orders || []).map((order: any) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.orderNumber} - {order.customer?.companyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sevkiyat Adresi</Label>
                          <Textarea
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Sevkiyat adresi girin"
                          />
                        </div>
                        <Button 
                          onClick={handleCreateInvoice}
                          disabled={!selectedOrder || !shippingAddress}
                          className="w-full"
                        >
                          İrsaliye Oluştur
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="İrsaliye ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="draft">Taslak</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="shipped">Sevk Edildi</SelectItem>
                      <SelectItem value="delivered">Teslim Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      İrsaliye bulunamadı
                    </div>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                              <Badge variant={getStatusVariant(invoice.status) as any}>
                                {getStatusLabel(invoice.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {invoice.customer?.companyName} • {formatDate(invoice.createdAt)}
                            </p>
                            <p className="font-medium">
                              {formatCurrency(parseFloat(invoice.order?.totalAmount || '0'))}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            {invoice.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInvoiceStatusMutation.mutate({
                                  id: invoice.id,
                                  status: 'shipped'
                                })}
                              >
                                Sevk Et
                              </Button>
                            )}
                            {invoice.status === 'shipped' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInvoiceStatusMutation.mutate({
                                  id: invoice.id,
                                  status: 'delivered'
                                })}
                              >
                                Teslim Et
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}