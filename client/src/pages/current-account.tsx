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
import marupakLogo from "@assets/MARUPAK_LOGO_1757030221412.png";

// İrsaliye Component'i
const InvoiceDeliverySlips = ({ invoiceId }: { invoiceId: string }) => {
  const [showDeliverySlipDetail, setShowDeliverySlipDetail] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  // Shipping modal states
  const [showDeliverySlipDialog, setShowDeliverySlipDialog] = useState(false);
  const [deliverySlipData, setDeliverySlipData] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const { data: deliverySlips, isLoading } = useQuery<any[]>({
    queryKey: [`/api/invoices/${invoiceId}/delivery-slips`],
    enabled: !!invoiceId,
    retry: false,
    staleTime: 0, // Always fresh
    gcTime: 0, // No cache
  });

  // Fatura bilgilerini çek (müşteri bilgileri için)
  const { data: invoiceData } = useQuery<any>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
    retry: false,
  });

  console.log("🚚 Modal irsaliye debug:", { invoiceId, isLoading, deliverySlips });

  const handleSlipClick = async (slip: any) => {
    console.log('🚚 CURRENT-ACCOUNT irsaliye tıklandı:', slip);
    console.log('📋 CURRENT-ACCOUNT slip data:', {
      id: slip.id,
      deliverySlipNumber: slip.deliverySlipNumber,
      status: slip.status,
      customerSignature: slip.customerSignature ? 'VAR' : 'YOK',
      signatureLength: slip.customerSignature?.length || 0
    });
    
    try {
      // Delivery slip'in orderId'sini alıp detayları getir
      const response = await apiRequest('GET', `/api/orders/${slip.orderId}/delivery-slips`);
      const deliverySlips: any[] = await response.json();
      console.log('📦 CURRENT-ACCOUNT API response:', deliverySlips);
      
      if (Array.isArray(deliverySlips) && deliverySlips.length > 0) {
        // İlgili slip'i bul - shipping modal'ı aç
        const targetSlip = deliverySlips.find(ds => ds.id === slip.id) || deliverySlips[0];
        console.log('✅ CURRENT-ACCOUNT target slip:', targetSlip);
        console.log('🎯 CURRENT-ACCOUNT target imza var mı?', targetSlip.customerSignature ? 'VAR' : 'YOK');
        console.log('📏 CURRENT-ACCOUNT imza uzunluk:', targetSlip.customerSignature?.length || 0);
        console.log('🔍 CURRENT-ACCOUNT imza başlangıç:', targetSlip.customerSignature?.substring(0, 100));
        setDeliverySlipData(targetSlip);
        
        // Order bilgilerini mock olarak oluştur
        const mockOrder = {
          customer: {
            companyName: invoiceData?.customer?.companyName || 'Müşteri',
            email: invoiceData?.customer?.email || '',
            phone: invoiceData?.customer?.phone || '',
            address: invoiceData?.customer?.address || ''
          }
        };
        setSelectedOrder(mockOrder);
        console.log('🚀 CURRENT-ACCOUNT shipping modal açılıyor...');
        setShowDeliverySlipDialog(true);
      } else {
        console.log('⚠️ CURRENT-ACCOUNT fallback modal');
        // Fallback to existing modal with existing data
        setSelectedSlip(slip);
        setShowDeliverySlipDetail(true);
      }
    } catch (error) {
      console.error('❌ CURRENT-ACCOUNT hata:', error);
      // Fallback to existing modal with existing data
      setSelectedSlip(slip);
      setShowDeliverySlipDetail(true);
    }
  };

  const handlePdfDownload = async (slip: any) => {
    try {
      // İlk önce imzayı hazırla
      let signatureImage = null;
      if (slip.customerSignature) {
        console.log('İmza hazırlanıyor...');
        signatureImage = await new Promise<string | null>((resolve) => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 80;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          
          const img = new Image();
          img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          };
          
          img.onerror = () => resolve(null);
          img.src = slip.customerSignature;
        });
        console.log('İmza hazırlandı:', signatureImage ? 'BAŞARILI' : 'BAŞARISIZ');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      console.log('PDF oluşturuluyor...');
      
      // Font ayarları
      pdf.setFont("helvetica", "normal");
      
      // ÜST BÖLÜM - BAŞLIK VE BİLGİLER
      let yPos = 20;
      
      // Sol - Müşteri Bilgileri
      pdf.setFontSize(12);
      pdf.text('Musteri Bilgileri', 20, yPos);
      
      const customerInfo = invoiceData?.customer;
      pdf.setFontSize(10);
      yPos += 10;
      pdf.text(`Firma: ${String(customerInfo?.companyName || 'Musteri Firma')}`, 20, yPos);
      yPos += 8;
      pdf.text(`E-posta: ${String(customerInfo?.email || 'info@firma.com')}`, 20, yPos);
      yPos += 8;
      pdf.text(`Telefon: ${String(customerInfo?.phone || '0555 123 45 67')}`, 20, yPos);
      
      // Orta - Teslim Fişi
      pdf.setFontSize(18);
      pdf.text('TESLIM FISI', 85, 25);
      pdf.setFontSize(12);
      pdf.text(`NO: ${String(slip.deliverySlipNumber || 'N/A')}`, 85, 35);
      
      // Sağ - MARUPAK LOGO RESMİ
      try {
        // Logo resmini PDF'e ekle
        pdf.addImage(marupakLogo, 'PNG', 140, 15, 50, 20);
      } catch (logoError) {
        console.log('Logo eklenemedi, metin kullanılıyor:', logoError);
        // Logo eklenemezse metin kullan
        pdf.setFontSize(18);
        pdf.text('MARUPAK', 140, 25);
        pdf.setFontSize(8);
        pdf.text('www.marupak.com', 140, 30);
        
        // Çerçeve
        pdf.rect(135, 15, 60, 20);
      }
      
      // ÜRÜN TABLOSU
      yPos = 65;
      
      // Tablo başlığı
      pdf.setFontSize(14);
      pdf.text('Malzemenin Adi', 30, yPos);
      pdf.text('Adet', 150, yPos);
      
      // Başlık altı çizgi
      pdf.setLineWidth(0.8);
      pdf.line(20, yPos + 3, 190, yPos + 3);
      
      yPos += 15;
      
      // Ürünler
      pdf.setFontSize(11);
      if (slip.items && slip.items.length > 0) {
        slip.items.forEach((item: any) => {
          // Türkçe karakter problemini çöz
          const productName = (item.productName || '').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
          const unit = (item.unit || '').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
          
          pdf.text(String(`${productName} (${unit})`), 30, yPos);
          pdf.text(String(item.deliveredQuantity || '0'), 150, yPos);
          yPos += 12;
        });
      }
      
      // Boşluk
      yPos = Math.max(yPos + 40, 180);
      
      // İMZA ALANLARI
      const signatureStartY = yPos;
      
      // Sol kutu - Teslim Eden (MARUPAK mührü)
      pdf.rect(25, signatureStartY, 70, 45);
      
      pdf.setFontSize(14);
      pdf.text('TESLIM EDEN', 30, signatureStartY + 12);
      
      pdf.setFontSize(16);
      pdf.text('MARUPAK', 30, signatureStartY + 25);
      
      pdf.setFontSize(10);
      pdf.text('Imza:', 30, signatureStartY + 35);
      
      // MARUPAK mührü/logosu alanı 
      try {
        pdf.addImage(marupakLogo, 'PNG', 50, signatureStartY + 28, 30, 15);
      } catch (logoError) {
        // Logo eklenemezse mühür alanı çiz
        pdf.rect(50, signatureStartY + 28, 30, 15);
        pdf.setFontSize(8);
        pdf.text('MARUPAK MUHUR', 52, signatureStartY + 37);
      }
      
      // Sağ taraf - Teslim Alan İsmi ve İmza
      const recipientName = slip.recipientName;
      
      pdf.setFontSize(14);
      pdf.text('TESLIM ALAN:', 110, signatureStartY + 12);
      
      pdf.setFontSize(12);
      pdf.text(String(recipientName || 'Teslim Alan'), 110, signatureStartY + 25);
      
      // MÜŞTERİ İMZA ALANI - Hazırlanan imzayı ekle
      if (signatureImage) {
        try {
          console.log('PDF İmzası ekleniyor...');
          pdf.addImage(signatureImage, 'PNG', 110, signatureStartY + 30, 65, 25);
          console.log('PDF İmzası başarıyla eklendi!');
        } catch (pdfError) {
          console.error('PDF imza ekleme hatası:', pdfError);
          pdf.setFontSize(10);
          pdf.text('MUSTERI IMZASI', 110, signatureStartY + 40);
        }
      } else {
        // İmza yoksa boş
        pdf.setFontSize(10);
        pdf.text('MUSTERI IMZASI', 110, signatureStartY + 40);
      }
      
      console.log('PDF hazır, indiriliyor...');
      
      // PDF'i indir
      pdf.save(`teslim-fisi-${slip.deliverySlipNumber}.pdf`);
      
      console.log('PDF indirildi!');
      
    } catch (error) {
      console.error('PDF HATASI:', error);
      alert(`PDF hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
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

  if (!deliverySlips || !Array.isArray(deliverySlips) || deliverySlips.length === 0) {
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
        {deliverySlips.map((slip: any) => (
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
              <Badge 
                variant={slip.status === 'delivered' ? 'default' : 'secondary'} 
                className={`text-xs ${slip.status === 'delivered' ? 'bg-green-500' : slip.status === 'shipping' ? 'bg-orange-500' : 'bg-gray-500'}`}
              >
                {slip.status === 'delivered' ? 'Teslim Edildi' : 
                 slip.status === 'shipping' ? 'Sevkiyatta' : 'Hazırlandı'}
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
                  <div><strong>Teslim Alan:</strong> {selectedSlip.recipientName}</div>
                  <div className="h-56 border-2 border-solid border-blue-500 rounded bg-blue-50 flex items-center justify-center p-4">
                    {selectedSlip.customerSignature ? (
                      <div className="w-full h-full flex flex-col">
                        <div className="text-lg text-green-600 font-medium mb-4">✅ Müşteri İmzası</div>
                        <div className="flex-1 flex items-center justify-center bg-white border-2 border-gray-300 rounded p-4">
                          <img 
                            src={selectedSlip.customerSignature} 
                            alt="Müşteri İmzası" 
                            className="h-full w-full object-contain"
                            style={{ 
                              minHeight: '120px', 
                              minWidth: '200px', 
                              filter: 'contrast(1.5) brightness(0.8)'
                            }}
                            onLoad={() => console.log('İmza yüklendi!')}
                            onError={(e) => console.error('İmza yükleme hatası:', e)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-blue-700 font-semibold text-sm mb-1">ALICI İMZASI</div>
                        <div className="text-xs text-blue-600">İmza alanı</div>
                      </div>
                    )}
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
      {/* Shipping Modal - İrsaliye Dialog */}
      {showDeliverySlipDialog && deliverySlipData && (
        <Dialog open={showDeliverySlipDialog} onOpenChange={setShowDeliverySlipDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Teslim Fişi - {deliverySlipData.deliverySlipNumber}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Müşteri Bilgileri */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-medium mb-2">Müşteri Bilgileri</h3>
                <p><strong>Firma:</strong> {selectedOrder?.customer?.companyName}</p>
                <p><strong>E-posta:</strong> {selectedOrder?.customer?.email}</p>
                <p><strong>Telefon:</strong> {selectedOrder?.customer?.phone}</p>
                <p><strong>Adres:</strong> {selectedOrder?.customer?.address}</p>
              </div>

              {/* İrsaliye Durumu */}
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-sm font-medium">Durum: </span>
                  <Badge className={`${
                    deliverySlipData.status === 'delivered' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {deliverySlipData.status === 'delivered' ? 'Teslim Edildi' : 'Sevkiyatta'}
                  </Badge>
                </div>
                {deliverySlipData.deliveredAt && (
                  <div>
                    <span className="text-sm font-medium">Teslimat Tarihi: </span>
                    <span className="text-sm">{new Date(deliverySlipData.deliveredAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              {/* Ürün Listesi */}
              <div>
                <h3 className="font-medium mb-2">Teslim Edilen Ürünler</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">Ürün Adı</th>
                        <th className="text-left py-2 px-4 font-medium">Miktar</th>
                        <th className="text-left py-2 px-4 font-medium">Birim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliverySlipData.items?.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-4">{item.productName}</td>
                          <td className="py-2 px-4">{item.deliveredQuantity || item.quantity}</td>
                          <td className="py-2 px-4">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* İmza Alanı */}
              {deliverySlipData.status === 'delivered' && (
                <div>
                  <h3 className="font-medium mb-2">Teslim Bilgileri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <div className="text-blue-700 font-semibold text-sm mb-2">TESLIM EDEN</div>
                      <div className="text-lg font-bold text-blue-800">MARUPAK</div>
                      <div className="text-xs text-blue-600 mt-2">www.marupak.com</div>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center">
                      {deliverySlipData.customerSignature ? (
                        <div>
                          <div className="text-blue-700 font-semibold text-sm mb-2">ALICI İMZASI</div>
                          <div className="flex flex-col items-center">
                            <div className="w-[150px] h-[60px] border border-gray-300 rounded bg-white flex items-center justify-center overflow-hidden">
                              {deliverySlipData.customerSignature && deliverySlipData.customerSignature.length > 200 ? (
                                <img 
                                  src={deliverySlipData.customerSignature} 
                                  alt="Müşteri İmzası" 
                                  className="max-w-full max-h-full object-contain"
                                  style={{ 
                                    imageRendering: 'crisp-edges',
                                    filter: 'contrast(1.2) brightness(0.9)'
                                  }}
                                  onLoad={() => console.log('✅ İmza yüklendi')}
                                  onError={(e) => {
                                    console.error('❌ İmza yükleme hatası:', e);
                                    console.log('🔍 İmza data uzunluk:', deliverySlipData.customerSignature?.length);
                                  }}
                                />
                              ) : (
                                <div className="text-xs text-gray-400 text-center">
                                  <div>⚠️</div>
                                  <div>Geçersiz İmza</div>
                                  <div className="text-[10px]">({deliverySlipData.customerSignature?.length || 0} byte)</div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-blue-600 mt-2">
                              {deliverySlipData.recipientName || 'Teslim Alan'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-blue-700 font-semibold text-sm mb-1">ALICI İMZASI</div>
                          <div className="text-xs text-blue-600">İmza alanı</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeliverySlipDialog(false)}>
                Kapat
              </Button>
              {deliverySlipData.status === 'delivered' && (
                <Button onClick={() => handlePdfDownload(deliverySlipData)}>
                  PDF İndir
                </Button>
              )}
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

  // Hesap ekstresi için state'ler
  const [accountStatementDateRange, setAccountStatementDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // 1 ay önce
    endDate: new Date().toISOString().split('T')[0] // Bugün
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

  // Hesap özeti hesaplama fonksiyonu  
  const getAccountSummary = (companyName: string) => {
    if (!companyName || !customerInvoices[companyName]) {
      return { totalDebit: 0, totalCredit: 0, balance: 0 };
    }
    
    const customerData = customerInvoices[companyName];
    const totalDebit = customerData.totalAmount || 0;
    
    // Bu müşterinin ödemelerini filtrele
    const customerId = customerData.customer?.id;
    const customerPayments = (allPayments && Array.isArray(allPayments)) 
      ? allPayments.filter((payment: any) => payment.customerId === customerId)
      : [];
    
    const totalCredit = customerPayments.reduce((sum: number, payment: any) => 
      sum + parseFloat(payment.amount || '0'), 0
    );
    
    const balance = totalDebit - totalCredit;
    
    return {
      totalDebit,
      totalCredit, 
      balance
    };
  };

  // Hesap ekstresi PDF indirme fonksiyonu
  const handleDownloadAccountStatement = async (companyName: string) => {
    try {
      if (!companyName || !customerInvoices[companyName]) {
        toast({
          title: "Hata",
          description: "Müşteri bilgisi bulunamadı",
          variant: "destructive",
        });
        return;
      }

      const customerData = customerInvoices[companyName];
      const summary = getAccountSummary(companyName);
      
      // PDF oluştur - Türkçe karakter desteği için font ayarla
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Türkçe karakter desteği için Unicode font kullan
      pdf.addFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xKKTU1Kvnz.woff2', 'Roboto', 'normal');
      pdf.setFont('Roboto', 'normal');
      
      // Header - Firma bilgisi ve logo alanı
      pdf.setFillColor(41, 128, 185); // Mavi başlık
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('MARUPAK', pageWidth / 2, 12, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('HESAP EKSTRESİ', pageWidth / 2, 22, { align: 'center' });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      let yPos = 45;
      
      // Müşteri bilgileri kutusu
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPos, pageWidth - 30, 25, 'F');
      pdf.rect(15, yPos, pageWidth - 30, 25, 'S');
      
      pdf.setFontSize(12);
      pdf.text('MÜŞTERİ BİLGİLERİ', 20, yPos + 8);
      pdf.setFontSize(11);
      pdf.text(`Firma Adı: ${companyName}`, 20, yPos + 16);
      pdf.text(`Ekstre Tarihi: ${formatDate(new Date().toISOString())}`, 120, yPos + 16);
      pdf.text(`Dönem: ${accountStatementDateRange.startDate} / ${accountStatementDateRange.endDate}`, 20, yPos + 22);
      
      yPos += 40;
      
      // Özet bilgiler tablosu
      pdf.setFontSize(12);
      pdf.text('FİNANSAL ÖZET', 20, yPos);
      yPos += 10;
      
      // Tablo başlıkları
      pdf.setFillColor(52, 73, 94);
      pdf.rect(15, yPos, pageWidth - 30, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('TOPLAM BORÇ', 20, yPos + 7);
      pdf.text('TOPLAM ÖDEME', 80, yPos + 7);
      pdf.text('KALAN BAKİYE', 140, yPos + 7);
      
      yPos += 10;
      
      // Tablo verileri
      pdf.setFillColor(255, 255, 255);
      pdf.rect(15, yPos, pageWidth - 30, 12, 'F');
      pdf.rect(15, yPos, pageWidth - 30, 12, 'S');
      
      pdf.setTextColor(220, 53, 69); // Kırmızı borç
      pdf.setFontSize(11);
      pdf.text(formatCurrency(summary.totalDebit), 20, yPos + 8);
      
      pdf.setTextColor(40, 167, 69); // Yeşil ödeme
      pdf.text(formatCurrency(summary.totalCredit), 80, yPos + 8);
      
      // Bakiye rengi
      if (summary.balance >= 0) {
        pdf.setTextColor(220, 53, 69); // Kırmızı borç
      } else {
        pdf.setTextColor(40, 167, 69); // Yeşil alacak
      }
      pdf.text(`${formatCurrency(Math.abs(summary.balance))} ${summary.balance >= 0 ? '(B)' : '(A)'}`, 140, yPos + 8);
      
      yPos += 25;
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Faturalar tablosu
      pdf.setFontSize(12);
      pdf.text('FATURA DETAYLARI', 20, yPos);
      yPos += 10;
      
      // Fatura tablo başlıkları
      pdf.setFillColor(52, 73, 94);
      pdf.rect(15, yPos, pageWidth - 30, 10, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text('FATURA NO', 20, yPos + 7);
      pdf.text('TARIH', 80, yPos + 7);
      pdf.text('TUTAR', 130, yPos + 7);
      pdf.text('DURUM', 165, yPos + 7);
      
      yPos += 10;
      
      // Fatura satırları
      pdf.setTextColor(0, 0, 0);
      let rowColor = true;
      
      customerData.invoices.forEach((invoice: CustomerInvoice, index: number) => {
        // Alternating row colors
        if (rowColor) {
          pdf.setFillColor(249, 249, 249);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
        
        pdf.setFontSize(9);
        pdf.text(invoice.invoiceNumber, 20, yPos + 6);
        pdf.text(formatDate(invoice.createdAt), 80, yPos + 6);
        pdf.text(formatCurrency(parseFloat(invoice.totalAmount || '0')), 130, yPos + 6);
        
        // Status
        const status = invoice.status === 'generated' ? 'Oluşturuldu' : 
                      invoice.status === 'paid' ? 'Ödendi' : invoice.status;
        pdf.text(status, 165, yPos + 6);
        
        yPos += 8;
        rowColor = !rowColor;
        
        // Sayfa sonu kontrolü
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 30;
          rowColor = true;
        }
      });
      
      yPos += 15;
      
      // Ödemeler tablosu
      const customerId = customerData.invoices[0]?.customerId;
      const customerPayments = (allPayments && Array.isArray(allPayments)) 
        ? allPayments.filter((payment: any) => payment.customerId === customerId)
        : [];
      
      if (customerPayments.length > 0) {
        // Sayfa sonu kontrolü ödemeler için
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = 30;
        }
        
        pdf.setFontSize(12);
        pdf.text('ÖDEME DETAYLARI', 20, yPos);
        yPos += 10;
        
        // Ödeme tablo başlıkları
        pdf.setFillColor(40, 167, 69);
        pdf.rect(15, yPos, pageWidth - 30, 10, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.text('ÖDEME TARİHİ', 20, yPos + 7);
        pdf.text('TUTAR', 80, yPos + 7);
        pdf.text('YÖNTEM', 130, yPos + 7);
        pdf.text('AÇIKLAMA', 165, yPos + 7);
        
        yPos += 10;
        
        // Ödeme satırları
        pdf.setTextColor(0, 0, 0);
        rowColor = true;
        
        customerPayments.forEach((payment: any) => {
          // Alternating row colors
          if (rowColor) {
            pdf.setFillColor(240, 248, 255);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
          
          pdf.setFontSize(9);
          pdf.text(formatDate(payment.paymentDate), 20, yPos + 6);
          pdf.text(formatCurrency(parseFloat(payment.amount || '0')), 80, yPos + 6);
          
          // Ödeme yöntemi
          const method = payment.paymentMethod === 'cash' ? 'Nakit' :
                        payment.paymentMethod === 'transfer' ? 'Havale' :
                        payment.paymentMethod === 'credit_card' ? 'Kredi Kartı' :
                        payment.paymentMethod === 'check' ? 'Çek' : payment.paymentMethod;
          pdf.text(method, 130, yPos + 6);
          
          // Açıklama (kısa)
          const description = payment.description ? payment.description.substring(0, 20) + '...' : '-';
          pdf.text(description, 165, yPos + 6);
          
          yPos += 8;
          rowColor = !rowColor;
          
          // Sayfa sonu kontrolü
          if (yPos > pageHeight - 50) {
            pdf.addPage();
            yPos = 30;
            rowColor = true;
          }
        });
      }
      
      // Footer
      const footerY = pageHeight - 20;
      pdf.setFillColor(41, 128, 185);
      pdf.rect(0, footerY, pageWidth, 20, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('MARUPAK Satis ve Uretim Yonetim Sistemi', pageWidth / 2, footerY + 10, { align: 'center' });
      pdf.text(`Olusturma Tarihi: ${formatDate(new Date().toISOString())}`, pageWidth / 2, footerY + 15, { align: 'center' });
      
      pdf.save(`hesap-ekstresi-${companyName}-${accountStatementDateRange.startDate}-${accountStatementDateRange.endDate}.pdf`);
      
      toast({
        title: "Başarılı",
        description: "Hesap ekstresi indirildi",
      });
    } catch (error) {
      console.error('Hesap ekstresi PDF hatası:', error);
      toast({
        title: "Hata", 
        description: "Hesap ekstresi oluşturulurken hata oluştu",
        variant: "destructive",
      });
    }
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

                {/* Hesap Ekstresi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Hesap Ekstresi
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleDownloadAccountStatement(selectedCustomer)}
                        className="flex items-center gap-1"
                      >
                        <Receipt className="w-4 h-4" />
                        Ekstre İndir
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Tarih Filtreleme */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Başlangıç Tarihi</label>
                          <Input 
                            type="date" 
                            value={accountStatementDateRange.startDate}
                            onChange={(e) => setAccountStatementDateRange(prev => ({
                              ...prev,
                              startDate: e.target.value
                            }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Bitiş Tarihi</label>
                          <Input 
                            type="date" 
                            value={accountStatementDateRange.endDate}
                            onChange={(e) => setAccountStatementDateRange(prev => ({
                              ...prev,
                              endDate: e.target.value
                            }))}
                          />
                        </div>
                      </div>

                      {/* Özet Bilgiler */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded">
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {formatCurrency(getAccountSummary(selectedCustomer).totalDebit)}
                          </div>
                          <div className="text-xs text-muted-foreground">Toplam Borç</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(getAccountSummary(selectedCustomer).totalCredit)}
                          </div>
                          <div className="text-xs text-muted-foreground">Toplam Ödeme</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            getAccountSummary(selectedCustomer).balance >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(Math.abs(getAccountSummary(selectedCustomer).balance))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getAccountSummary(selectedCustomer).balance >= 0 ? 'Kalan Borç' : 'Fazla Ödeme'}
                          </div>
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