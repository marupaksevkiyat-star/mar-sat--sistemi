import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Building2, FileText, Receipt, Eye, Calendar, ArrowLeft, CreditCard, TrendingUp, AlertTriangle, Plus, DollarSign } from "lucide-react";

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  createdAt: string;
  status: string;
  notes?: string;
  customer: {
    companyName: string;
    email?: string;
    phone?: string;
  };
}

interface InvoiceDetail {
  orderIds: string[];
  orderCount: number;
  groupedProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalAmount: number;
    unit: string;
  }>;
  subtotal: number;
  kdvAmount: number;
  totalWithKdv: number;
}

export default function CurrentAccountPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tüm faturaları getir
  const { data: allInvoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  // Müşteri bazında faturaları grupla
  const customerInvoices = (allInvoices && Array.isArray(allInvoices)) ? 
    (allInvoices as CustomerInvoice[]).reduce((acc: any, invoice: CustomerInvoice) => {
      const companyName = invoice.customer?.companyName || 'Bilinmeyen Müşteri';
      if (!acc[companyName]) {
        acc[companyName] = {
          customer: invoice.customer || { companyName: 'Bilinmeyen Müşteri' },
          invoices: [],
          totalAmount: 0,
          invoiceCount: 0
        };
      }
      acc[companyName].invoices.push(invoice);
      acc[companyName].totalAmount += parseFloat(invoice.totalAmount || '0');
      acc[companyName].invoiceCount++;
      return acc;
    }, {}) : {};

  // Tüm müşterilerin ödemelerini getir
  const { data: allPayments } = useQuery({
    queryKey: ["/api/payments"],
    retry: false,
  });

  // Seçili müşterinin gerçek ID'sini al
  const selectedCustomerId = selectedCustomer ? customerInvoices[selectedCustomer]?.customer?.id : null;

  // Ödeme ekleme mutation
  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const paymentData = {
        customerId: selectedCustomerId || selectedCustomer,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        description: paymentForm.description,
        paymentDate: paymentForm.paymentDate,
        dueDate: paymentForm.paymentDate,
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
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${selectedCustomerId}/payments`] });
      
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
    
    addPaymentMutation.mutate();
  };

  // Seçili müşterinin ödemelerini getir
  const { data: customerPayments } = useQuery({
    queryKey: [`/api/customers/${selectedCustomerId}/payments`],
    enabled: !!selectedCustomerId,
    retry: false,
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Müşteri cari hesap durumlarını hesapla
  const getCustomerAccountStatus = (companyName: string, customerData: any) => {
    const customerId = customerData.customer?.id;
    const totalInvoices = customerData.totalAmount || 0;
    
    // Bu müşterinin ödemelerini filtrele
    const customerPayments = (allPayments && Array.isArray(allPayments)) 
      ? allPayments.filter((payment: any) => payment.customerId === customerId)
      : [];
    
    const totalPayments = customerPayments.reduce((sum: number, payment: any) => 
      sum + parseFloat(payment.amount || '0'), 0
    );
    
    const balance = totalInvoices - totalPayments;
    const lastPayment = customerPayments.length > 0 
      ? customerPayments.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
      : null;
    
    // Debug bilgileri
    console.log(`🔍 Cari hesap debug - ${companyName}:`, {
      customerId,
      totalInvoices,
      customerPayments,
      totalPayments,
      balance,
      lastPayment,
      allPaymentsCount: allPayments?.length || 0
    });
    
    return {
      totalInvoices,
      totalPayments,
      balance: Math.max(0, balance),
      lastPayment,
      paymentCount: customerPayments.length
    };
  };

  console.log("📊 Grouped customer invoices:", customerInvoices);

  const filteredCustomers = Object.entries(customerInvoices).filter(([companyName]) => 
    companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvoiceClick = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  // Fatura detayını parse et
  const parseInvoiceDetails = (notes: string): InvoiceDetail | null => {
    try {
      // notes'tan bilgileri çıkar
      if (notes.includes("Akıllı toplu fatura")) {
        // Basit parse işlemi
        const orderCountMatch = notes.match(/(\d+) sipariş/);
        const kdvMatch = notes.match(/%(\d+) KDV dahil: ([\d,.]+) TL/);
        
        return {
          orderIds: [],
          orderCount: orderCountMatch ? parseInt(orderCountMatch[1]) : 0,
          groupedProducts: [],
          subtotal: 0,
          kdvAmount: 0,
          totalWithKdv: kdvMatch ? parseFloat(kdvMatch[2].replace(',', '')) : 0
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Yükleniyor...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Cari Hesap</h1>
          
          {/* Arama */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-customer"
            />
          </div>
        </div>

        {!selectedCustomer ? (
          /* FİRMA LİSTESİ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(([companyName, data]: [string, any]) => (
                <Card 
                  key={companyName} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedCustomer(companyName)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {companyName}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const accountStatus = getCustomerAccountStatus(companyName, data);
                      return (
                        <div className="space-y-4">
                          {/* Cari Hesap Özeti */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Fatura Sayısı:</span>
                              <div className="font-semibold text-lg">{data.invoiceCount} adet</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Toplam Satış:</span>
                              <div className="font-semibold text-lg text-green-600">
                                {formatCurrency(accountStatus.totalInvoices)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Toplam Ödeme:</span>
                              <div className="font-semibold text-lg text-blue-600">
                                {formatCurrency(accountStatus.totalPayments)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Borç Bakiyesi:</span>
                              <div className={`font-semibold text-lg ${
                                accountStatus.balance > 0 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(accountStatus.balance)}
                              </div>
                            </div>
                          </div>

                          {/* Son Ödeme ve Fatura Bilgisi */}
                          <div className="pt-2 border-t space-y-2">
                            {accountStatus.lastPayment && (
                              <div>
                                <div className="text-xs text-muted-foreground">Son Ödeme:</div>
                                <div className="font-medium text-sm text-green-600">
                                  {formatCurrency(parseFloat(accountStatus.lastPayment.amount))} 
                                  <span className="text-muted-foreground ml-1">
                                    ({formatDate(accountStatus.lastPayment.paymentDate)})
                                  </span>
                                </div>
                              </div>
                            )}
                            {data.invoices.length > 0 && (
                              <div>
                                <div className="text-xs text-muted-foreground">Son Fatura:</div>
                                <div className="font-medium text-sm">
                                  {data.invoices[data.invoices.length - 1].invoiceNumber}
                                  <span className="text-muted-foreground ml-1">
                                    ({formatDate(data.invoices[data.invoices.length - 1].createdAt)})
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Henüz fatura bulunamadı</p>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Arama kriterlerinize uygun fatura yok' : 'Sistemde hiç fatura oluşturulmamış'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* FİRMA CARİ HESAP DETAYLARI */
          <div className="space-y-6">
            {/* Geri Dönüş ve Başlık */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Firma Listesine Dön
              </Button>
              <h2 className="text-xl font-semibold">
                {selectedCustomer} - Cari Hesap
              </h2>
            </div>

            {/* Firma Cari Hesap İçeriği */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SOL - Fatura Listesi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Faturalar ({customerInvoices[selectedCustomer]?.invoiceCount || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {customerInvoices[selectedCustomer]?.invoices.map((invoice: CustomerInvoice) => (
                      <div 
                        key={invoice.id} 
                        className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(invoice.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-green-700 mb-1">
                            {invoice.status === 'generated' ? 'Oluşturuldu' : invoice.status}
                          </Badge>
                          <div className="text-sm font-semibold">
                            {formatCurrency(parseFloat(invoice.totalAmount || '0'))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* SAĞ - Cari Hesap Özellikleri */}
              <div className="space-y-6">
                {/* Hesap Özeti */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Hesap Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {customerInvoices[selectedCustomer]?.invoiceCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Toplam Fatura</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(customerInvoices[selectedCustomer]?.totalAmount || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Toplam Satış</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalInvoices = customerInvoices[selectedCustomer]?.totalAmount || 0;
                            const totalPayments = (customerPayments && Array.isArray(customerPayments)) 
                              ? customerPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0)
                              : 0;
                            const balance = totalInvoices - totalPayments;
                            return formatCurrency(Math.max(0, balance)); // Negative bakiye gösterme
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">Borç Bakiyesi</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="text-2xl font-bold text-red-600">
                          {customerInvoices[selectedCustomer]?.invoices.filter((inv: any) => {
                            const dueDate = new Date(inv.createdAt);
                            dueDate.setDate(dueDate.getDate() + 30); // 30 gün vade
                            return dueDate < new Date() && inv.status !== 'paid';
                          }).length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Vadesi Geçen</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ödeme Geçmişi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Ödeme Geçmişi
                      </div>
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => setShowPaymentDialog(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Ödeme Ekle
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {(customerPayments && Array.isArray(customerPayments) && customerPayments.length > 0) ? (
                        customerPayments.map((payment: any) => (
                          <div key={payment.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <div className="font-medium">
                                {payment.paymentMethod === 'nakit' ? 'Nakit Ödeme' : 
                                 payment.paymentMethod === 'havale' ? 'Banka Havalesi' :
                                 payment.paymentMethod === 'kredi_karti' ? 'Kredi Kartı' :
                                 payment.paymentMethod === 'cek' ? 'Çek Ödemesi' : payment.paymentMethod}
                              </div>
                              <div className="text-sm text-muted-foreground">{formatDate(payment.paymentDate)}</div>
                              {payment.description && (
                                <div className="text-xs text-muted-foreground">{payment.description}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">+{formatCurrency(parseFloat(payment.amount))}</div>
                              <Badge variant="outline" className="text-green-700">
                                {payment.status === 'completed' ? 'Tamamlandı' : 
                                 payment.status === 'pending' ? 'Beklemede' : payment.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Henüz ödeme yapılmamış</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Vade Takibi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Vade Takibi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customerInvoices[selectedCustomer]?.invoices
                        .filter((invoice: CustomerInvoice) => {
                          const dueDate = new Date(invoice.createdAt);
                          dueDate.setDate(dueDate.getDate() + 30); // 30 gün vade
                          return invoice.status !== 'paid';
                        })
                        .map((invoice: CustomerInvoice) => {
                          const dueDate = new Date(invoice.createdAt);
                          dueDate.setDate(dueDate.getDate() + 30);
                          const today = new Date();
                          const isOverdue = dueDate < today;
                          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div 
                              key={invoice.id}
                              className={`flex justify-between items-center p-3 border rounded ${
                                isOverdue 
                                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200' 
                                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                              }`}
                            >
                              <div>
                                <div className={`font-medium ${
                                  isOverdue 
                                    ? 'text-red-800 dark:text-red-200' 
                                    : 'text-yellow-800 dark:text-yellow-200'
                                }`}>
                                  Fatura #{invoice.invoiceNumber}
                                </div>
                                <div className={`text-sm ${
                                  isOverdue 
                                    ? 'text-red-600 dark:text-red-300' 
                                    : 'text-yellow-600 dark:text-yellow-300'
                                }`}>
                                  Vade: {formatDate(dueDate.toISOString())} 
                                  {isOverdue 
                                    ? ` (${Math.abs(daysDiff)} gün gecikme)` 
                                    : ` (${daysDiff} gün kaldı)`
                                  }
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold ${
                                  isOverdue ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {formatCurrency(parseFloat(invoice.totalAmount || '0'))}
                                </div>
                              </div>
                            </div>
                          );
                        }) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Vadesi yaklaşan fatura yok</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* FATURA DETAY MODAL */}
        <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Fatura Detayı: {selectedInvoice?.invoiceNumber}
              </DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Fatura Bilgileri */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Müşteri Bilgileri</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Firma:</strong> {selectedInvoice.customer?.companyName}</div>
                      <div><strong>E-posta:</strong> {selectedInvoice.customer?.email || '-'}</div>
                      <div><strong>Telefon:</strong> {selectedInvoice.customer?.phone || '-'}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Fatura Bilgileri</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Fatura No:</strong> {selectedInvoice.invoiceNumber}</div>
                      <div><strong>Tarih:</strong> {formatDate(selectedInvoice.createdAt)}</div>
                      <div><strong>Durum:</strong> 
                        <Badge variant="outline" className="ml-2">
                          {selectedInvoice.status === 'generated' ? 'Oluşturuldu' : selectedInvoice.status}
                        </Badge>
                      </div>
                      <div><strong>Tutar:</strong> {formatCurrency(parseFloat(selectedInvoice.totalAmount || '0'))}</div>
                    </div>
                  </div>
                </div>

                {/* Fatura Notları */}
                {selectedInvoice.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Fatura Detayları</h3>
                    <div className="p-4 bg-muted/30 rounded text-sm">
                      {selectedInvoice.notes}
                    </div>
                  </div>
                )}

                {/* Gelecekte: İrsaliye detayları, ödeme geçmişi vs. */}
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2" />
                  <p>Ödeme geçmişi ve detaylı irsaliye bilgileri yakında eklenecek...</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowInvoiceDetail(false)}>
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ÖDEME EKLEME MODAL */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ödeme Ekle - {selectedCustomer}</DialogTitle>
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
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  İptal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddPayment}
                  disabled={addPaymentMutation.isPending}
                >
                  {addPaymentMutation.isPending ? "Ekleniyor..." : "Ödeme Ekle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}