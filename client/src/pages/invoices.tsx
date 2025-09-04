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
import { FileText, Plus, Search, Truck, Package, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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

  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", statusFilter],
    retry: false,
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders", "ready-for-shipping"],
    retry: false,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      // Dashboard verilerini de güncelle
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
      // Dashboard verilerini de güncelle
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount));
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">İrsaliye Yönetimi</h2>
            <p className="text-muted-foreground mt-1">Sevkiyat ve teslimat takibi</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invoice">
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
                  <Label htmlFor="order-select">Sipariş Seç</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sipariş seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orders as any[] || []).map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          #{order.id.slice(-8)} - {order.customer?.companyName || order.customer?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shipping-address">Teslimat Adresi</Label>
                  <Textarea
                    id="shipping-address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Teslimat adresini girin"
                    data-testid="textarea-shipping-address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ek notlar"
                    data-testid="textarea-invoice-notes"
                  />
                </div>
                <Button 
                  onClick={handleCreateInvoice} 
                  disabled={!selectedOrder || !shippingAddress || createInvoiceMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-invoice"
                >
                  {createInvoiceMutation.isPending ? "Oluşturuluyor..." : "İrsaliye Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="İrsaliye no, müşteri adı veya takip numarası ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-invoices"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value: InvoiceStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="shipped">Sevk Edildi</SelectItem>
                  <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>İrsaliye Listesi</span>
              <Badge variant="secondary">
                {filteredInvoices.length} irsaliye
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">İrsaliye No</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Müşteri</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Durum</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Takip No</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tarih</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tutar</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p>Henüz irsaliye bulunmuyor</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invoice.status)}
                            <span className="font-medium text-sm" data-testid={`invoice-number-${invoice.id}`}>
                              {invoice.invoiceNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm" data-testid={`invoice-customer-${invoice.id}`}>
                          <div>
                            <p className="font-medium">
                              {invoice.customer?.companyName || invoice.customer?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {invoice.shippingAddress}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={getStatusVariant(invoice.status)} data-testid={`invoice-status-${invoice.id}`}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm" data-testid={`invoice-tracking-${invoice.id}`}>
                          {invoice.trackingNumber || '-'}
                        </td>
                        <td className="py-3 px-2 text-sm" data-testid={`invoice-date-${invoice.id}`}>
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium" data-testid={`invoice-amount-${invoice.id}`}>
                          {invoice.order ? formatCurrency(invoice.order.totalAmount) : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center gap-2">
                            {invoice.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateInvoiceStatusMutation.mutate({
                                  id: invoice.id,
                                  status: 'shipped'
                                })}
                                data-testid={`button-ship-${invoice.id}`}
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
                                data-testid={`button-deliver-${invoice.id}`}
                              >
                                Teslim Et
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}