import { storage } from "./storage";
import type { OrderWithDetails, MailTemplate } from "@shared/schema";

// Mail template variables'ları replace etmek için fonksiyon
export function renderTemplate(template: MailTemplate, order: OrderWithDetails): { subject: string; htmlContent: string; textContent: string } {
  const variables = {
    customerName: order.customer.contactPerson || order.customer.companyName,
    customerEmail: order.customer.email || '',
    customerAddress: order.customer.address || '',
    orderNumber: order.orderNumber,
    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '',
    deliveryDate: order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
    deliveryTime: order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString('tr-TR') : new Date().toLocaleTimeString('tr-TR'),
    salesPerson: `${order.salesPerson.firstName} ${order.salesPerson.lastName}`,
    receiverName: order.deliveryReceiverName || order.customer.contactPerson || order.customer.companyName,
    companyName: 'Şirket Adı',
    companyPhone: '+90 212 555 0123',
    companyEmail: 'info@company.com',
    companyAddress: 'İstanbul, Türkiye',
    // Ürün listesi oluştur (sadece isim ve miktar, fiyat yok)
    products: order.items.map(item => `${item.product.name} - ${item.quantity} ${item.product.unit}`).join(', ')
  };

  // Template içindeki değişkenleri replace et
  let renderedSubject = template.subject;
  let renderedHtmlContent = template.htmlContent;
  let renderedTextContent = template.textContent || '';

  // Tüm değişkenleri replace et
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    renderedSubject = renderedSubject.replace(regex, value || '');
    renderedHtmlContent = renderedHtmlContent.replace(regex, value || '');
    renderedTextContent = renderedTextContent.replace(regex, value || '');
  });

  return {
    subject: renderedSubject,
    htmlContent: renderedHtmlContent,
    textContent: renderedTextContent
  };
}

// Teslim mail'i gönderme fonksiyonu
export async function sendDeliveryNotification(orderId: string): Promise<boolean> {
  try {
    // Sipariş detaylarını al
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error('Order not found for delivery notification:', orderId);
      return false;
    }

    // Müşteri email adresi kontrolü
    if (!order.customer.email) {
      console.log('Customer email not found, skipping delivery notification for order:', orderId);
      return false;
    }

    // Teslim mail şablonunu al
    const templates = await storage.getMailTemplates();
    const deliveryTemplate = templates.find(t => 
      t.templateType === 'order_delivered' && t.isActive && t.isDefault
    );

    if (!deliveryTemplate) {
      console.error('Delivery template not found or not active');
      return false;
    }

    // Template'i render et
    const renderedTemplate = renderTemplate(deliveryTemplate, order);

    // Email içeriğini hazırla
    const emailData = {
      to: order.customer.email,
      subject: renderedTemplate.subject,
      htmlContent: renderedTemplate.htmlContent,
      textContent: renderedTemplate.textContent,
      customerName: order.customer.contactPerson || order.customer.companyName
    };

    // Log the email (gerçek mail server olmadığı için console'a yazdır)
    console.log('📧 DELIVERY NOTIFICATION EMAIL:');
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('Customer:', emailData.customerName);
    console.log('Order:', order.orderNumber);
    console.log('---');

    // Gerçek projesinde burada SMTP server ile mail gönderilir
    // Şimdilik mailto: link ile kullanıcı kendi mail uygulamasından gönderebilir
    
    return true;
  } catch (error) {
    console.error('Error sending delivery notification:', error);
    return false;
  }
}

// Mail gönderme helper - mailto link oluştur
export async function createMailtoLink(order: OrderWithDetails): Promise<string> {
  try {
    const templates = await storage.getMailTemplates();
    const deliveryTemplate = templates.find(t => 
      t.templateType === 'order_delivered' && t.isActive
    );

    if (!deliveryTemplate || !order.customer.email) {
      return '';
    }

    const renderedTemplate = renderTemplate(deliveryTemplate, order);
    
    // Mailto link oluştur
    const subject = encodeURIComponent(renderedTemplate.subject);
    const body = encodeURIComponent(renderedTemplate.textContent);
    const to = encodeURIComponent(order.customer.email);
    
    return `mailto:${to}?subject=${subject}&body=${body}`;
  } catch (error) {
    console.error('Error creating mailto link:', error);
    return '';
  }
}