import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Building2, FileText, Receipt, Eye, Calendar } from "lucide-react";

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
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  // Tüm faturaları getir
  const { data: allInvoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", "all"],
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(([companyName, data]: [string, any]) => (
              <Card key={companyName} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {companyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Müşteri Özeti */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fatura Sayısı:</span>
                        <div className="font-semibold">{data.invoiceCount} adet</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Toplam Tutar:</span>
                        <div className="font-semibold">{formatCurrency(data.totalAmount)}</div>
                      </div>
                    </div>

                    {/* Son Faturalar */}
                    <div>
                      <h4 className="font-medium mb-2">Faturalar:</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.invoices.map((invoice: CustomerInvoice) => (
                          <div 
                            key={invoice.id} 
                            className="flex justify-between items-center p-2 border rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleInvoiceClick(invoice)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{invoice.invoiceNumber}</div>
                              <div className="text-xs text-muted-foreground">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Henüz fatura bulunamadı</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Arama kriterlerinize uygun fatura yok' : 'Sistende hiç fatura oluşturulmamış'}
              </p>
            </div>
          )}
        </div>

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