import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  // Tüm faturaları getir
  const { data: allInvoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
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

  // Debug log - fatura verilerini kontrol et
  console.log("🔍 All invoices data:", allInvoices);
  
  // Müşteri bazında faturaları grupla
  const customerInvoices = allInvoices ? 
    allInvoices.reduce((acc: any, invoice: CustomerInvoice) => {
      console.log("🔍 Processing invoice:", {
        invoiceNumber: invoice.invoiceNumber,
        hasCustomer: !!invoice.customer,
        customer: invoice.customer
      });
      
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
                    <div className="space-y-4">
                      {/* Firma Özeti */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Fatura Sayısı:</span>
                          <div className="font-semibold text-lg">{data.invoiceCount} adet</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Toplam Tutar:</span>
                          <div className="font-semibold text-lg text-green-600">
                            {formatCurrency(data.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Son Fatura Bilgisi */}
                      {data.invoices.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">Son Fatura:</div>
                          <div className="font-medium text-sm">
                            {data.invoices[data.invoices.length - 1].invoiceNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(data.invoices[data.invoices.length - 1].createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
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
                          ₺12,450
                        </div>
                        <div className="text-sm text-muted-foreground">Borç Bakiyesi</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="text-2xl font-bold text-red-600">
                          2
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
                      <Button size="sm" className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        Ödeme Ekle
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* Örnek ödeme kayıtları */}
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">Nakit Ödeme</div>
                          <div className="text-sm text-muted-foreground">28.08.2025</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">+₺5,000</div>
                          <Badge variant="outline" className="text-green-700">Tamamlandı</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">Banka Havalesi</div>
                          <div className="text-sm text-muted-foreground">25.08.2025</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">+₺8,750</div>
                          <Badge variant="outline" className="text-green-700">Tamamlandı</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">Çek Ödemesi</div>
                          <div className="text-sm text-muted-foreground">20.09.2025 - Vade</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-orange-600">₺3,200</div>
                          <Badge variant="outline" className="text-orange-700">Beklemede</Badge>
                        </div>
                      </div>
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
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded">
                        <div>
                          <div className="font-medium text-red-800 dark:text-red-200">Fatura #SMART-20250815-143022</div>
                          <div className="text-sm text-red-600 dark:text-red-300">Vade: 15.08.2025 (20 gün gecikme)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">₺4,800</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded">
                        <div>
                          <div className="font-medium text-yellow-800 dark:text-yellow-200">Fatura #SMART-20250820-091155</div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-300">Vade: 10.09.2025 (5 gün kaldı)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-yellow-600">₺7,650</div>
                        </div>
                      </div>
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
      </main>
    </div>
  );
}