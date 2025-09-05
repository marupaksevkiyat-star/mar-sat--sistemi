import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import DeliveryInterface from "@/components/shipping/delivery-interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";
import jsPDF from 'jspdf';
import marupakLogo from "@assets/MARUPAK_LOGO_1757030221412.png";

export default function Shipping() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDeliverySlipDialog, setShowDeliverySlipDialog] = useState(false);
  const [deliverySlipData, setDeliverySlipData] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: readyOrders, isLoading: readyLoading } = useQuery({
    queryKey: ["/api/orders", "status", "production_ready"],
    queryFn: () => fetch("/api/orders?status=production_ready", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  // Debug: Log orders to see their status
  if (readyOrders) {
    console.log('🚚 Ready Orders:', readyOrders.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status })));
  }

  const { data: shippingOrders, isLoading: shippingLoading } = useQuery({
    queryKey: ["/api/orders", "status", "shipping"],
    queryFn: () => fetch("/api/orders?status=shipping", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  // Debug: Log shipping orders
  if (shippingOrders) {
    console.log('🚛 Shipping Orders:', shippingOrders.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status })));
  }

  const { data: deliveredOrders, isLoading: deliveredLoading } = useQuery({
    queryKey: ["/api/orders", "status", "delivered"],
    queryFn: () => fetch("/api/orders?status=delivered", { credentials: "include" }).then(res => res.json()),
    retry: false,
  });

  // Debug: Log delivered orders to see their status  
  if (deliveredOrders) {
    console.log('✅ Delivered Orders:', deliveredOrders.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status })));
  }

  const createDeliveryNoteMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      return await apiRequest(`/api/orders/${orderId}/status`, 'PUT', { status: "shipping" });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Başarılı",
        description: "İrsaliye oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "production_ready"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "shipping"] });
      // Dashboard verilerini de güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      
      // Set as active delivery
      const order = readyOrders?.find((o: any) => o.id === variables.orderId);
      if (order) {
        setActiveDelivery(order);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "İrsaliye oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, recipient, signature }: { orderId: string; recipient: string; signature?: string }) => {
      return await apiRequest(`/api/orders/${orderId}/status`, "PUT", {
        status: "delivered",
        deliveryRecipient: recipient,
        deliverySignature: signature,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Teslimat tamamlandı",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "shipping"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "status", "delivered"] });
      // Dashboard verilerini de güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      setActiveDelivery(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "Teslimat tamamlanırken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleCreateDeliveryNote = (orderId: string) => {
    createDeliveryNoteMutation.mutate({ orderId });
  };

  // İrsaliye görüntüleme
  const handleViewDeliverySlip = async (order: any) => {
    try {
      // Delivery slip bilgilerini fetch et
      const response = await apiRequest(`/api/orders/${order.id}/delivery-slips`, 'GET');
      const deliverySlips: any[] = await response.json();
      
      if (Array.isArray(deliverySlips) && deliverySlips.length > 0) {
        setDeliverySlipData(deliverySlips[0]);
        setSelectedOrder(order);
        setShowDeliverySlipDialog(true);
      } else {
        toast({
          title: "İrsaliye bulunamadı",
          description: "Bu sipariş için irsaliye bulunamadı",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İrsaliye bilgileri yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // PDF indirme
  const handlePdfDownload = async (slip: any) => {
    try {
      // İmzayı hazırla
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
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      
      // Font ayarları
      pdf.setFont("helvetica", "normal");
      
      let yPos = 20;
      
      // Sol - Müşteri Bilgileri
      pdf.setFontSize(12);
      pdf.text('Musteri Bilgileri', 20, yPos);
      
      const customerInfo = selectedOrder?.customer;
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
      pdf.text(`NO: ${String(slip.deliverySlipNumber || '').split('-').pop() || 'N/A'}`, 85, 35);
      
      // Sağ - MARUPAK LOGO
      try {
        pdf.addImage(marupakLogo, 'PNG', 140, 15, 50, 20);
      } catch (logoError) {
        pdf.setFontSize(18);
        pdf.text('MARUPAK', 140, 25);
        pdf.setFontSize(8);
        pdf.text('www.marupak.com', 140, 30);
        pdf.rect(135, 15, 60, 20);
      }
      
      // ÜRÜN TABLOSU
      yPos = 65;
      pdf.setFontSize(14);
      pdf.text('Malzemenin Adi', 30, yPos);
      pdf.text('Adet', 150, yPos);
      pdf.setLineWidth(0.8);
      pdf.line(20, yPos + 3, 190, yPos + 3);
      
      yPos += 15;
      pdf.setFontSize(11);
      if (slip.items && slip.items.length > 0) {
        slip.items.forEach((item: any) => {
          const productName = (item.productName || '').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
          const unit = (item.unit || '').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
          
          pdf.text(String(`${productName} (${unit})`), 30, yPos);
          pdf.text(String(item.deliveredQuantity || '0'), 150, yPos);
          yPos += 12;
        });
      }
      
      // İMZA ALANLARI
      yPos = Math.max(yPos + 40, 180);
      const signatureStartY = yPos;
      
      // Sol kutu - Teslim Eden (MARUPAK mührü)
      pdf.rect(25, signatureStartY, 70, 45);
      pdf.setFontSize(14);
      pdf.text('TESLIM EDEN', 30, signatureStartY + 12);
      pdf.setFontSize(16);
      pdf.text('MARUPAK', 30, signatureStartY + 25);
      pdf.setFontSize(10);
      pdf.text('Imza:', 30, signatureStartY + 35);
      
      try {
        pdf.addImage(marupakLogo, 'PNG', 50, signatureStartY + 28, 30, 15);
      } catch (logoError) {
        pdf.rect(50, signatureStartY + 28, 30, 15);
        pdf.setFontSize(8);
        pdf.text('MARUPAK MUHUR', 52, signatureStartY + 37);
      }
      
      // Sağ taraf - Teslim Alan İsmi ve İmza
      pdf.setFontSize(14);
      pdf.text('TESLIM ALAN:', 110, signatureStartY + 12);
      pdf.setFontSize(12);
      pdf.text(String(slip.recipientName || 'Teslim Alan'), 110, signatureStartY + 25);
      
      // MÜŞTERİ İMZA ALANI
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
        pdf.setFontSize(10);
        pdf.text('MUSTERI IMZASI', 110, signatureStartY + 40);
      }
      
      pdf.save(`teslim-fisi-${slip.deliverySlipNumber}.pdf`);
      
    } catch (error) {
      console.error('PDF HATASI:', error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDelivery = (recipient: string, signature?: string) => {
    if (activeDelivery) {
      console.log('🎯 Canvas-based async Promise ile imza işleniyor...', signature ? 'VAR' : 'YOK');
      
      // Canvas-based async Promise ile SVG → PNG dönüşümü
      const processSignatureAsync = async () => {
        if (!signature || signature === 'undefined' || signature === 'null') {
          console.log('❌ İmza yok, null gönderiliyor');
          return null;
        }
        
        try {
          // Validate base64 data
          if (!signature.startsWith('data:image/png;base64,')) {
            console.log('❌ Geçersiz imza formatı');
            return null;
          }
          
          // Test if image is valid by creating new Image
          return new Promise<string | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
              console.log('✅ İmza geçerli, gönderiliyor');
              resolve(signature);
            };
            img.onerror = () => {
              console.log('❌ İmza bozuk, null gönderiliyor');
              resolve(null);
            };
            img.src = signature;
          });
        } catch (error) {
          console.error('❌ İmza işleme hatası:', error);
          return null;
        }
      };
      
      // Async signature processing
      processSignatureAsync().then((validSignature) => {
        console.log('🚀 Final imza:', validSignature ? 'GERÇEK' : 'NULL');
        completeDeliveryMutation.mutate({
          orderId: activeDelivery.id,
          recipient,
          signature: validSignature || undefined,
        });
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Bekliyor", className: "status-pending" },
      production: { label: "Üretimde", className: "status-production" },
      production_ready: { label: "Hazır", className: "status-ready" },
      shipping: { label: "Sevkiyatta", className: "status-shipping" },
      delivered: { label: "Teslim Edildi", className: "status-delivered" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "" };
    
    return (
      <Badge className={config.className} data-testid={`status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Sevkiyat Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Teslimat ve sevkiyat süreçleri</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ready for Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Sevkiyata Hazır Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {readyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !readyOrders || readyOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-truck text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Sevkiyata hazır sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readyOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`order-ready-${order.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">{order.customer.companyName}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        <p>
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {order.deliveryAddress || order.customer.address}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleCreateDeliveryNote(order.id)}
                          className="flex-1"
                          size="sm"
                          data-testid={`button-create-delivery-${order.id}`}
                        >
                          <i className="fas fa-file-alt mr-2"></i>
                          İrsaliye Oluştur
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          data-testid={`button-view-details-${order.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Orders - Yolda Olanlar */}
          <Card>
            <CardHeader>
              <CardTitle>Yolda Olan Siparişler</CardTitle>
            </CardHeader>
            <CardContent>
              {shippingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !shippingOrders || shippingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-truck text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Yolda olan sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shippingOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`order-shipping-${order.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">{order.customer.companyName}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        <p>
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {order.deliveryAddress || order.customer.address}
                        </p>
                        <p className="mt-1">
                          <i className="fas fa-clock mr-2"></i>
                          Sevk: {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setActiveDelivery(order)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                          data-testid={`button-start-delivery-${order.id}`}
                        >
                          <i className="fas fa-play mr-2"></i>
                          Teslimat Başlat
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          data-testid={`button-view-shipping-details-${order.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Delivery Interface */}
          <DeliveryInterface
            activeDelivery={activeDelivery}
            onCompleteDelivery={handleCompleteDelivery}
          />
        </div>

        {/* Delivery History */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Teslim Edilenler</CardTitle>
              <Button 
                onClick={async () => {
                  try {
                    const response = await apiRequest('/api/orders/sync-invoiced-deliveries', 'POST');
                    toast({
                      title: "Başarılı",
                      description: response.message || "İrsaliyeler senkronize edildi",
                    });
                    // Sayfayı yenile
                    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                  } catch (error) {
                    toast({
                      title: "Hata",
                      description: "Senkronizasyon sırasında bir hata oluştu",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline" 
                size="sm"
                className="ml-auto"
              >
                İrsaliyeleri Senkronize Et
              </Button>
            </CardHeader>
            <CardContent>
              {deliveredLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !deliveredOrders || deliveredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-check-circle text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Henüz teslim edilen sipariş bulunmamaktadır</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Sipariş No</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Müşteri</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Teslimat Tarihi</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Teslim Alan</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveredOrders.map((order: any) => (
                        <tr key={order.id} className="border-b border-border hover:bg-accent/30">
                          <td className="py-3 px-4 text-sm font-medium text-foreground">
                            <button 
                              onClick={() => handleViewDeliverySlip(order)}
                              className="text-primary hover:underline cursor-pointer"
                              data-testid={`button-view-order-${order.id}`}
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.customer.companyName}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.deliveredAt && order.deliveredAt !== '1970-01-01T00:00:00.000Z' 
                              ? new Date(order.deliveredAt).toLocaleDateString('tr-TR')
                              : 'Teslim tarihi belirtilmemiş'
                            }
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {order.deliveryRecipient || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* İrsaliye Dialog */}
      {showDeliverySlipDialog && deliverySlipData && (
        <Dialog open={showDeliverySlipDialog} onOpenChange={setShowDeliverySlipDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>İrsaliye Detayları - {deliverySlipData.deliverySlipNumber}</DialogTitle>
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
                            <img 
                              src={deliverySlipData.customerSignature} 
                              alt="Müşteri İmzası" 
                              className="max-w-[150px] max-h-[60px] border border-gray-300 rounded"
                              onError={(e) => console.error('İmza yükleme hatası:', e)}
                            />
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
    </div>
  );
}
