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
import { Search, Building2, FileText, Receipt, Eye, Calendar, ArrowLeft, CreditCard, TrendingUp, AlertTriangle, Plus, DollarSign, Package } from "lucide-react";
import jsPDF from 'jspdf';
import marupakLogo from "@assets/MARUPAK-LOGO_1757026981432.png";

// İrsaliye Component'i
const InvoiceDeliverySlips = ({ invoiceId }: { invoiceId: string }) => {
  const [showDeliverySlipDetail, setShowDeliverySlipDetail] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  
  const { data: deliverySlips, isLoading } = useQuery<any[]>({
    queryKey: [`/api/invoices/${invoiceId}/delivery-slips`],
    enabled: !!invoiceId,
    retry: false,
  });

  console.log("🚚 Modal irsaliye debug:", { invoiceId, isLoading, deliverySlips });

  const handleSlipClick = (slip: any) => {
    setSelectedSlip(slip);
    setShowDeliverySlipDetail(true);
  };

  const handlePdfDownload = (slip: any) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Türkçe karakter desteği için encoding ayarı
      pdf.setFont("helvetica");
      
      // Üst başlık bölümü - firma bilgileri
      pdf.setLineWidth(1);
      pdf.rect(10, 10, pageWidth - 20, 50);
      
      // Sol taraf - Logo ve firma bilgileri
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('MARUPAK', 15, 25);
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text('Turkoba Mah.Eski Catalaca Yolu Cad.No:5', 15, 32);
      pdf.text('Buyukcekmece/Istanbul', 15, 38);
      pdf.text('Tel: 0850 345 84 90', 15, 44);
      pdf.text('www.marupak.com', 15, 50);
      
      // Orta - Teslim Fişi başlığı
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      const centerX = pageWidth / 2;
      pdf.text('TESLIM FISI', centerX - 20, 30);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${formatDate(slip.deliveredAt)}`, centerX - 15, 40);
      
      // Sağ taraf - Teslim edilecek firma bilgileri
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('TESLIM EDILECEK FIRMA:', pageWidth - 80, 25);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text('[Musteri Firma Adi]', pageWidth - 80, 32);
      pdf.text('[Musteri Adresi]', pageWidth - 80, 38);
      pdf.text('[Telefon]', pageWidth - 80, 44);
      pdf.text('[Email]', pageWidth - 80, 50);
      
      let yPos = 75;
      
      // Ürün tablosu - header
      const tableStartY = yPos;
      const colWidths = [70, 30, 30, 30, 30]; // Açıklama, Miktar, Fiyat, Toplam
      const colX = [15, 85, 115, 145, 175];
      
      // Tablo başlık satırı - mavi arka plan
      pdf.setFillColor(70, 130, 180);
      pdf.rect(10, tableStartY, pageWidth - 20, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('Aciklama', colX[0], tableStartY + 7);
      pdf.text('Miktar', colX[1], tableStartY + 7);
      pdf.text('Birim', colX[2], tableStartY + 7);
      pdf.text('Fiyat', colX[3], tableStartY + 7);
      pdf.text('Toplam', colX[4], tableStartY + 7);
      
      // Sıfırla renkleri
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      
      yPos = tableStartY + 10;
      
      // Ürün satırları
      if (slip.items && slip.items.length > 0) {
        slip.items.forEach((item: any, index: number) => {
          const rowHeight = 15;
          
          // Satır çerçevesi
          pdf.setLineWidth(0.3);
          pdf.rect(10, yPos, pageWidth - 20, rowHeight);
          
          // Dikey çizgiler
          pdf.line(colX[1] - 5, yPos, colX[1] - 5, yPos + rowHeight);
          pdf.line(colX[2] - 5, yPos, colX[2] - 5, yPos + rowHeight);
          pdf.line(colX[3] - 5, yPos, colX[3] - 5, yPos + rowHeight);
          pdf.line(colX[4] - 5, yPos, colX[4] - 5, yPos + rowHeight);
          
          // Ürün bilgileri
          pdf.setFontSize(9);
          pdf.text(item.productName || 'Urun', colX[0], yPos + 10);
          pdf.text(String(item.deliveredQuantity || '0'), colX[1], yPos + 10);
          pdf.text(item.unit || 'Adet', colX[2], yPos + 10);
          pdf.text('0.00', colX[3], yPos + 10); // Fiyat
          pdf.text('0.00', colX[4], yPos + 10); // Toplam
          
          yPos += rowHeight;
        });
      }
      
      // Boş satırlar ekle (toplam 15 satır olsun)
      const maxRows = 15;
      const currentRows = slip.items?.length || 0;
      for (let i = currentRows; i < maxRows; i++) {
        const rowHeight = 15;
        pdf.setLineWidth(0.3);
        pdf.rect(10, yPos, pageWidth - 20, rowHeight);
        
        // Dikey çizgiler
        pdf.line(colX[1] - 5, yPos, colX[1] - 5, yPos + rowHeight);
        pdf.line(colX[2] - 5, yPos, colX[2] - 5, yPos + rowHeight);
        pdf.line(colX[3] - 5, yPos, colX[3] - 5, yPos + rowHeight);
        pdf.line(colX[4] - 5, yPos, colX[4] - 5, yPos + rowHeight);
        
        yPos += rowHeight;
      }
      
      // Toplam satırı
      pdf.setFillColor(70, 130, 180);
      pdf.rect(10, yPos, pageWidth - 20, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Toplam', colX[3], yPos + 10);
      pdf.text('0.00 TL', colX[4], yPos + 10);
      
      // KDV satırları
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');
      yPos += 15;
      
      pdf.setLineWidth(0.3);
      pdf.rect(10, yPos, pageWidth - 20, 12);
      pdf.line(colX[3] - 5, yPos, colX[3] - 5, yPos + 12);
      pdf.line(colX[4] - 5, yPos, colX[4] - 5, yPos + 12);
      pdf.setFontSize(9);
      pdf.text('KDV %', colX[3], yPos + 8);
      pdf.text('0.00', colX[4], yPos + 8);
      
      yPos += 12;
      pdf.rect(10, yPos, pageWidth - 20, 12);
      pdf.line(colX[3] - 5, yPos, colX[3] - 5, yPos + 12);
      pdf.line(colX[4] - 5, yPos, colX[4] - 5, yPos + 12);
      pdf.text('G.Toplam', colX[3], yPos + 8);
      pdf.text('0.00', colX[4], yPos + 8);
      
      yPos += 25;
      
      // Alt imza bölümü
      const signatureY = Math.max(yPos, pageHeight - 60);
      
      // Sol taraf - Teslim Eden
      pdf.setLineWidth(0.5);
      pdf.rect(15, signatureY, 80, 40);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Teslim Eden', 20, signatureY + 15);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text(`${slip.driverName}`, 20, signatureY + 25);
      pdf.text('Imza: _______________', 20, signatureY + 35);
      
      // Sağ taraf - Teslim Alan (Alıcı İmzası)
      pdf.rect(115, signatureY, 80, 40);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Teslim Alan', 120, signatureY + 15);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.text('Adi Soyadi: _______________', 120, signatureY + 25);
      pdf.text('Imza: _______________', 120, signatureY + 35);
      
      // PDF'i indir
      pdf.save(`irsaliye-${slip.deliverySlipNumber}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-xs text-muted-foreground">İrsaliyeler yükleniyor...</p>
      </div>
    );
  }

  if (!deliverySlips || deliverySlips.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Bu faturaya ait irsaliye bulunamadı</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="space-y-3">
        {deliverySlips.map((slip) => (
          <div key={slip.id} className="border rounded-lg p-3 bg-muted/20">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p 
                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline"
                  onClick={() => handleSlipClick(slip)}
                >
                  {slip.deliverySlipNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Teslim: {formatDate(slip.deliveredAt)}
                </p>
              </div>
              <Badge variant={slip.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                {slip.status === 'delivered' ? 'Teslim Edildi' : 'Hazırlandı'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Şoför:</strong> {slip.driverName}</p>
              <p><strong>Araç:</strong> {slip.vehiclePlate}</p>
              {slip.notes && <p><strong>Not:</strong> {slip.notes}</p>}
            </div>
            
            {/* İrsaliye İçerikleri */}
            {slip.items && slip.items.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">İrsaliye İçeriği:</p>
                <div className="space-y-1">
                  {slip.items.map((item: any, index: number) => (
                    <div key={index} className="text-xs text-muted-foreground flex justify-between">
                      <span>{item.productName}</span>
                      <span>{item.deliveredQuantity}/{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    
    {/* İrsaliye Detay Modal */}
    {showDeliverySlipDetail && selectedSlip && (
      <Dialog open={showDeliverySlipDetail} onOpenChange={setShowDeliverySlipDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              İmzalı İrsaliye: {selectedSlip.deliverySlipNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* İrsaliye Bilgileri */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Teslimat Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>İrsaliye No:</strong> {selectedSlip.deliverySlipNumber}</div>
                  <div><strong>Teslimat Tarihi:</strong> {formatDate(selectedSlip.deliveredAt)}</div>
                  <div><strong>Durum:</strong> 
                    <Badge variant="default" className="ml-2">
                      {selectedSlip.status === 'delivered' ? 'Teslim Edildi' : 'Hazırlandı'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Nakliye Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Şoför:</strong> {selectedSlip.driverName}</div>
                  <div><strong>Araç Plakası:</strong> {selectedSlip.vehiclePlate}</div>
                  <div><strong>Not:</strong> {selectedSlip.notes || 'Yok'}</div>
                </div>
              </div>
            </div>

            {/* İrsaliye Kalemleri */}
            <div>
              <h3 className="font-semibold mb-3">İrsaliye Kalemleri</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Ürün</th>
                      <th className="text-center p-3">Miktar</th>
                      <th className="text-center p-3">Birim</th>
                      <th className="text-left p-3">Notlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSlip.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-medium">{item.productName}</td>
                        <td className="text-center p-3">{item.deliveredQuantity}</td>
                        <td className="text-center p-3">{item.unit}</td>
                        <td className="p-3">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* İmza Alanı */}
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Teslimat Onayı</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div><strong>Teslim Eden:</strong> {selectedSlip.driverName}</div>
                  <div className="h-20 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-muted-foreground text-xs">
                    Nakliyeci İmzası
                  </div>
                </div>
                <div className="space-y-3">
                  <div><strong>Teslim Alan:</strong> [Müşteri Adı]</div>
                  <div className="h-20 border-2 border-solid border-blue-500 rounded bg-blue-50 flex items-center justify-center p-2">
                    <div className="text-center">
                      <div className="text-blue-700 font-semibold text-sm mb-1">ALICI İMZASI</div>
                      <div className="text-xs text-blue-600">İmza alanı</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-right text-xs text-muted-foreground">
                Tarih: {formatDate(selectedSlip.deliveredAt)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeliverySlipDetail(false)}>
              Kapat
            </Button>
            <Button onClick={() => handlePdfDownload(selectedSlip)}>
              PDF İndir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

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

                {/* İrsaliye Bilgileri */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    İrsaliyeler
                  </h3>
                  <InvoiceDeliverySlips invoiceId={selectedInvoice.id} />
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