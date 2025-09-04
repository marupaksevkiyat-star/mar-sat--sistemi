import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, FileText, CreditCard, Package, Calendar, User, Building2, MapPin, Phone, Mail } from "lucide-react";
import { useLocation } from "wouter";

interface InvoiceDetailProps {
  invoiceId: string;
}

interface InvoicePayment {
  id: string;
  amount: string;
  paymentMethod: string;
  description: string;
  paymentDate: string;
  status: string;
  createdAt: string;
}

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  totalPrice: string;
}

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotalAmount: string;
  taxAmount: string;
  totalAmount: string;
  taxRate: string;
  description: string;
  notes: string;
  createdAt: string;
  customer: {
    companyName: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
}

export default function InvoiceDetailPage({ invoiceId }: InvoiceDetailProps) {
  const [, setLocation] = useLocation();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    retry: false,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/payments`],
    retry: false,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/items`],
    retry: false,
  });

  // Ödeme ekleme mutation
  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const paymentData = {
        invoiceId: invoiceId,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        description: paymentForm.description,
        paymentDate: new Date(paymentForm.paymentDate),
        dueDate: new Date(paymentForm.paymentDate),
        status: 'completed'
      };
      return await apiRequest('POST', '/api/payments', paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ödeme başarıyla eklendi",
      });
      
      // Verileri güncelle
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      
      // Formu sıfırla ve modalı kapat
      setPaymentForm({
        amount: '',
        paymentMethod: '',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0]
      });
      setShowPaymentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ödeme eklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  });

  const handleAddPayment = () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tutar ve ödeme yöntemini girin",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast({
        title: "Geçersiz Tutar",
        description: "Lütfen geçerli bir tutar girin",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > remainingBalance) {
      toast({
        title: "Geçersiz Tutar",
        description: "Tutar kalan bakiyeden fazla olamaz",
        variant: "destructive",
      });
      return;
    }
    
    addPaymentMutation.mutate();
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { label: 'Taslak', color: 'bg-gray-100 text-gray-700' },
      'generated': { label: 'Oluşturuldu', color: 'bg-blue-100 text-blue-700' },
      'sent': { label: 'Gönderildi', color: 'bg-yellow-100 text-yellow-700' },
      'paid': { label: 'Ödendi', color: 'bg-green-100 text-green-700' },
      'cancelled': { label: 'İptal Edildi', color: 'bg-red-100 text-red-700' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap = {
      'nakit': { label: 'Nakit', color: 'bg-green-100 text-green-700' },
      'havale': { label: 'Havale/EFT', color: 'bg-blue-100 text-blue-700' },
      'kredi_karti': { label: 'Kredi Kartı', color: 'bg-purple-100 text-purple-700' },
      'cek': { label: 'Çek', color: 'bg-yellow-100 text-yellow-700' }
    };
    
    const methodInfo = methodMap[method as keyof typeof methodMap] || { label: method, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={methodInfo.color}>
        {methodInfo.label}
      </Badge>
    );
  };

  if (invoiceLoading) {
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fatura Bulunamadı</h2>
            <p className="text-gray-600 mb-6">Aradığınız fatura mevcut değil veya silinmiş olabilir.</p>
            <Button onClick={() => setLocation('/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Faturalar Sayfasına Dön
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const invoiceDetails = invoice as InvoiceDetails;
  const totalPaid = (payments && Array.isArray(payments)) ? payments.reduce((sum: number, payment: InvoicePayment) => sum + parseFloat(payment.amount), 0) : 0;
  const remainingBalance = parseFloat(invoiceDetails.totalAmount) - totalPaid;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başlık ve Geri Butonu */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/invoices')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fatura Detayı: {invoiceDetails.invoiceNumber}</h1>
              <p className="text-muted-foreground">Müşteri: {invoiceDetails.customer?.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(invoiceDetails.status)}
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Yazdır
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ana İçerik - Sol Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Müşteri Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Müşteri Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{invoiceDetails.customer?.companyName}</p>
                    {invoiceDetails.customer?.contactPerson && (
                      <p className="text-sm text-muted-foreground">İletişim: {invoiceDetails.customer.contactPerson}</p>
                    )}
                  </div>
                </div>
                
                {invoiceDetails.customer?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{invoiceDetails.customer.phone}</span>
                  </div>
                )}
                
                {invoiceDetails.customer?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{invoiceDetails.customer.email}</span>
                  </div>
                )}
                
                {invoiceDetails.customer?.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{invoiceDetails.customer.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fatura Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fatura No</label>
                    <p className="font-mono text-lg">{invoiceDetails.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tarih</label>
                    <p>{formatDate(invoiceDetails.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Durum</label>
                    <div className="mt-1">{getStatusBadge(invoiceDetails.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tutar</label>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(invoiceDetails.totalAmount)}</p>
                  </div>
                </div>
                {invoiceDetails.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Açıklama</label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded">{invoiceDetails.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fatura Detayları - İrsaliye Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Fatura Detayları
                </CardTitle>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">İrsaliye bilgileri yükleniyor...</p>
                  </div>
                ) : (items && Array.isArray(items) && items.length > 0) ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3">Ürün</th>
                            <th className="text-center p-3">Miktar</th>
                            <th className="text-center p-3">Birim</th>
                            <th className="text-right p-3">Birim Fiyat</th>
                            <th className="text-right p-3">Toplam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(items as InvoiceItem[]).map((item: InvoiceItem) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-3 font-medium">{item.productName}</td>
                              <td className="text-center p-3">{item.quantity}</td>
                              <td className="text-center p-3">{item.unit}</td>
                              <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-right p-3 font-medium">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Fatura Toplamları */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between py-1">
                          <span>Ara Toplam:</span>
                          <span className="font-medium">{formatCurrency(invoiceDetails.subtotalAmount)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>KDV (%{invoiceDetails.taxRate}):</span>
                          <span className="font-medium">{formatCurrency(invoiceDetails.taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between py-2 text-lg font-bold">
                          <span>GENEL TOPLAM:</span>
                          <span>{formatCurrency(invoiceDetails.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{invoiceDetails.description || "İrsaliye bilgileri bulunamadı"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sağ Panel - Ödeme Bilgileri */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Ödeme Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Ödeme Özeti */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Toplam Tutar:</span>
                    <span className="font-medium">{formatCurrency(invoiceDetails.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ödenen:</span>
                    <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Kalan Bakiye:</span>
                    <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </div>

                {/* Ödeme Listesi */}
                {paymentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Ödeme geçmişi yükleniyor...</p>
                  </div>
                ) : (payments && Array.isArray(payments) && payments.length > 0) ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Ödeme Detayları</h4>
                    {(payments as InvoicePayment[]).map((payment: InvoicePayment) => (
                      <div key={payment.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            {getPaymentMethodBadge(payment.paymentMethod)}
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(payment.paymentDate)}
                            </p>
                          </div>
                          <span className="font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        {payment.description && (
                          <p className="text-xs text-muted-foreground">
                            {payment.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz ödeme yapılmamış</p>
                  </div>
                )}

                {/* Ödeme Ekleme Butonu */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Debug: Kalan bakiye: {remainingBalance} TL</p>
                  {remainingBalance >= 0 && (
                  <div>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ödeme Ekle
                    </Button>
                    
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Ödeme Ekle</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="amount">Tutar (TL) *</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="paymentDate">Tarih *</Label>
                              <Input
                                id="paymentDate"
                                type="date"
                                value={paymentForm.paymentDate}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
                            <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Ödeme yöntemi seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nakit">Nakit</SelectItem>
                                <SelectItem value="havale">Havale/EFT</SelectItem>
                                <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                                <SelectItem value="cek">Çek</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                              id="description"
                              placeholder="Ödeme hakkında not..."
                              value={paymentForm.description}
                              onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span>Kalan Bakiye:</span>
                            <span className="font-bold text-red-600">{formatCurrency(remainingBalance)}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowPaymentDialog(false)}
                              className="flex-1"
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={handleAddPayment}
                              disabled={addPaymentMutation.isPending || !paymentForm.amount || !paymentForm.paymentMethod}
                              className="flex-1"
                            >
                              {addPaymentMutation.isPending ? 'Ödeme Ekleniyor...' : 'Ödeme Ekle'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}