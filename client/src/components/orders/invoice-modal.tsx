import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { OrderWithDetails } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails;
}

const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(numAmount);
};

const formatDate = (dateString: string | Date | null) => {
  if (!dateString) return 'Tarih belirtilmemiş';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const { toast } = useToast();
  const [emailRecipient, setEmailRecipient] = useState(order.customer?.email || '');
  const [emailSubject, setEmailSubject] = useState(`İrsaliye - Sipariş #${order.orderNumber}`);
  const [emailMessage, setEmailMessage] = useState('');

  const isDelivered = order.status === 'delivered';

  // Mail gönderme mutation (mailto: link yaklaşımı)
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { to: string; subject: string; message: string; orderHtml: string }) => {
      return await apiRequest("POST", "/api/orders/send-invoice", emailData);
    },
    onSuccess: (data: any) => {
      // Kullanıcının varsayılan e-posta uygulamasını aç
      if (data.mailtoLink) {
        window.open(data.mailtoLink, '_blank');
      }
      toast({
        title: "Başarılı",
        description: "E-posta uygulamanız açıldı. İrsaliye içeriğini manuel olarak ekleyebilirsiniz.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "E-posta linki oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>İrsaliye - Sipariş #${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { text-align: center; margin-bottom: 30px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .order-details { width: 48%; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { width: 200px; text-align: center; }
            .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
            .delivered-signature { border: 2px solid #4ade80; padding: 10px; background-color: #f0fdf4; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSendEmail = () => {
    if (!emailRecipient) {
      toast({
        title: "Hata",
        description: "E-posta adresi gerekli",
        variant: "destructive",
      });
      return;
    }

    const invoiceContent = document.getElementById('invoice-content');
    if (!invoiceContent) return;

    const orderHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        ${invoiceContent.innerHTML}
      </div>
    `;

    sendEmailMutation.mutate({
      to: emailRecipient,
      subject: emailSubject,
      message: emailMessage,
      orderHtml
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-file-invoice text-blue-600"></i>
            İrsaliye - Sipariş #{order.orderNumber}
            {isDelivered && <span className="text-green-600 text-sm">(Teslim Edilmiş)</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* İrsaliye İçeriği */}
          <div id="invoice-content" className="bg-white p-6 border rounded-lg">
            {/* Şirket Başlığı */}
            <div className="header">
              <h1 className="text-2xl font-bold mb-2">ÜRETIM SİSTEMİ A.Ş.</h1>
              <div className="company-info">
                <p>Adres: Sanayi Mahallesi, Üretim Caddesi No:123, İstanbul</p>
                <p>Tel: (0212) 123 45 67 | E-posta: info@uretimsistemi.com</p>
                <p>Vergi No: 1234567890</p>
              </div>
            </div>

            {/* İrsaliye Başlığı */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">İRSALİYE</h2>
              <p className="text-gray-600">Sipariş No: #{order.orderNumber}</p>
            </div>

            {/* Sipariş ve Müşteri Bilgileri */}
            <div className="order-info">
              <div className="customer-info">
                <h3 className="font-bold mb-3">Müşteri Bilgileri</h3>
                <p><strong>Şirket:</strong> {order.customer?.companyName}</p>
                {order.customer?.contactPerson && (
                  <p><strong>İletişim:</strong> {order.customer.contactPerson}</p>
                )}
                {order.customer?.phone && (
                  <p><strong>Telefon:</strong> {order.customer.phone}</p>
                )}
                {order.customer?.email && (
                  <p><strong>E-posta:</strong> {order.customer.email}</p>
                )}
                {order.customer?.address && (
                  <p><strong>Adres:</strong> {order.customer.address}</p>
                )}
              </div>

              <div className="order-details">
                <h3 className="font-bold mb-3">Sipariş Bilgileri</h3>
                <p><strong>Sipariş Tarihi:</strong> {formatDate(order.createdAt)}</p>
                <p><strong>Durum:</strong> {
                  order.status === 'pending' ? 'Bekleyen' :
                  order.status === 'production' ? 'Üretimde' :
                  order.status === 'shipping' ? 'Sevkiyatta' :
                  order.status === 'delivered' ? 'Teslim Edildi' :
                  order.status === 'cancelled' ? 'İptal Edildi' : order.status
                }</p>
                <p><strong>Satış Temsilcisi:</strong> {order.salesPerson?.firstName} {order.salesPerson?.lastName}</p>
                {isDelivered && order.deliveredAt && (
                  <p><strong>Teslim Tarihi:</strong> {formatDate(order.deliveredAt)}</p>
                )}
                {isDelivered && order.deliveryRecipient && (
                  <p><strong>Teslim Alan:</strong> {order.deliveryRecipient}</p>
                )}
              </div>
            </div>

            {/* Ürün Listesi */}
            <table className="items-table">
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Birim</th>
                  <th>Miktar</th>
                  <th>Birim Fiyat</th>
                  <th>Toplam Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product?.name || 'Ürün'}</td>
                    <td>{item.product?.unit || 'adet'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500">Ürün bilgisi bulunamadı</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={4}><strong>Ara Toplam</strong></td>
                  <td><strong>{formatCurrency(order.totalAmount)}</strong></td>
                </tr>
                {parseFloat(order.taxAmount || '0') > 0 && (
                  <tr>
                    <td colSpan={4}><strong>KDV</strong></td>
                    <td><strong>{formatCurrency(order.taxAmount)}</strong></td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan={4}><strong>GENEL TOPLAM</strong></td>
                  <td><strong>{formatCurrency(parseFloat(order.totalAmount) + parseFloat(order.taxAmount || '0'))}</strong></td>
                </tr>
              </tfoot>
            </table>

            {/* Notlar */}
            {order.notes && (
              <div className="mb-6">
                <h3 className="font-bold mb-2">Notlar</h3>
                <p className="bg-gray-50 p-3 rounded">{order.notes}</p>
              </div>
            )}

            {/* İmza Alanı */}
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-line">
                  <p>Teslim Eden</p>
                  <p className="text-sm text-gray-600">(İmza ve Kaşe)</p>
                </div>
              </div>

              <div className="signature-box">
                <div className={`signature-line ${isDelivered ? 'delivered-signature' : ''}`}>
                  <p>Teslim Alan</p>
                  {isDelivered && order.deliverySignature ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-700">✓ İmzalandı</p>
                      <p className="text-xs text-gray-600">Dijital İmza Mevcut</p>
                      {order.deliveryRecipient && (
                        <p className="text-sm font-medium">{order.deliveryRecipient}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">(İmza)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Teslim Edilmiş İçin Ek Bilgi */}
            {isDelivered && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <h4 className="font-bold text-green-800 mb-2">✓ TESLİMAT TAMAMLANDI</h4>
                <div className="text-sm text-green-700">
                  <p><strong>Teslim Tarihi:</strong> {formatDate(order.deliveredAt)}</p>
                  {order.deliveryRecipient && (
                    <p><strong>Teslim Alan Kişi:</strong> {order.deliveryRecipient}</p>
                  )}
                  <p><strong>Durum:</strong> Bu irsaliye dijital olarak imzalanmış ve teslim tamamlanmıştır.</p>
                </div>
              </div>
            )}
          </div>

          {/* E-posta Gönderme Formu */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">E-posta ile Gönder</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email-recipient">Alıcı E-posta</Label>
                <Input
                  id="email-recipient"
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="musteri@email.com"
                  data-testid="input-email-recipient"
                />
              </div>
              <div>
                <Label htmlFor="email-subject">Konu</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  data-testid="input-email-subject"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="email-message">Mesaj (İsteğe bağlı)</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Ek mesajınız varsa buraya yazabilirsiniz..."
                rows={3}
                data-testid="textarea-email-message"
              />
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
              data-testid="button-print-invoice"
            >
              <i className="fas fa-print mr-2"></i>
              Yazdır
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={!emailRecipient || sendEmailMutation.isPending}
              className="flex-1"
              data-testid="button-send-email"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <i className="fas fa-envelope mr-2"></i>
                  E-posta Gönder
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}