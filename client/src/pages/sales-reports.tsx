import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, DollarSign, Users, FileText, Download, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export default function SalesReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: salesData, isLoading } = useQuery({
    queryKey: ["/api/reports/sales", selectedPeriod, selectedDate],
    retry: false,
  });

  const { data: topProducts } = useQuery({
    queryKey: ["/api/reports/top-products", selectedPeriod, selectedDate],
    retry: false,
  });

  const { data: salesByPerson } = useQuery({
    queryKey: ["/api/reports/sales-by-person", selectedPeriod, selectedDate],
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case 'daily': return 'Günlük';
      case 'weekly': return 'Haftalık';
      case 'monthly': return 'Aylık';
      default: return 'Günlük';
    }
  };

  const exportToCSV = () => {
    const data = [];
    
    // Add summary data
    const summary = salesData?.summary || {};
    data.push(['SATIŞ ÖZETİ']);
    data.push(['Toplam Satış', formatCurrency(summary.totalSales || 0)]);
    data.push(['Sipariş Sayısı', summary.orderCount || 0]);
    data.push(['Ortalama Sipariş', formatCurrency(summary.averageOrder || 0)]);
    data.push(['']);
    
    // Add sales by person
    if (salesByPerson && salesByPerson.length > 0) {
      data.push(['SATIŞ ELEMANI PERFORMANSI']);
      data.push(['Satış Elemanı', 'Toplam Satış', 'Sipariş Sayısı', 'Ortalama']);
      salesByPerson.forEach((person: any) => {
        data.push([
          `${person.firstName} ${person.lastName}`,
          formatCurrency(person.totalSales || 0),
          person.orderCount || 0,
          formatCurrency(person.averageOrder || 0)
        ]);
      });
      data.push(['']);
    }
    
    // Add top products
    if (topProducts && topProducts.length > 0) {
      data.push(['EN ÇOK SATAN ÜRÜNLER']);
      data.push(['Ürün Adı', 'Satış Miktarı', 'Toplam Tutar']);
      topProducts.forEach((product: any) => {
        data.push([
          product.name,
          product.quantity || 0,
          formatCurrency(product.totalSales || 0)
        ]);
      });
    }
    
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `satis-raporu-${getPeriodLabel(selectedPeriod)}-${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // Simple Excel-like format using HTML table
    const summary = salesData?.summary || {};
    
    let htmlContent = `
      <table border="1">
        <tr><td colspan="4"><strong>SATIŞ RAPORU - ${getPeriodLabel(selectedPeriod).toUpperCase()} (${formatDate(selectedDate)})</strong></td></tr>
        <tr><td colspan="4"></td></tr>
        <tr><td colspan="4"><strong>ÖZET</strong></td></tr>
        <tr><td>Toplam Satış</td><td>${formatCurrency(summary.totalSales || 0)}</td><td></td><td></td></tr>
        <tr><td>Sipariş Sayısı</td><td>${summary.orderCount || 0}</td><td></td><td></td></tr>
        <tr><td>Ortalama Sipariş</td><td>${formatCurrency(summary.averageOrder || 0)}</td><td></td><td></td></tr>
        <tr><td colspan="4"></td></tr>
    `;
    
    if (salesByPerson && salesByPerson.length > 0) {
      htmlContent += `
        <tr><td colspan="4"><strong>SATIŞCI PERFORMANSI</strong></td></tr>
        <tr><td><strong>Satış Elemanı</strong></td><td><strong>Toplam Satış</strong></td><td><strong>Sipariş Sayısı</strong></td><td><strong>Ortalama</strong></td></tr>
      `;
      salesByPerson.forEach((person: any) => {
        htmlContent += `
          <tr>
            <td>${person.firstName} ${person.lastName}</td>
            <td>${formatCurrency(person.totalSales || 0)}</td>
            <td>${person.orderCount || 0}</td>
            <td>${formatCurrency(person.averageOrder || 0)}</td>
          </tr>
        `;
      });
      htmlContent += '<tr><td colspan="4"></td></tr>';
    }
    
    if (topProducts && topProducts.length > 0) {
      htmlContent += `
        <tr><td colspan="4"><strong>EN ÇOK SATAN ÜRÜNLER</strong></td></tr>
        <tr><td><strong>Ürün Adı</strong></td><td><strong>Satış Miktarı</strong></td><td><strong>Toplam Tutar</strong></td><td></td></tr>
      `;
      topProducts.forEach((product: any) => {
        htmlContent += `
          <tr>
            <td>${product.name}</td>
            <td>${product.quantity || 0}</td>
            <td>${formatCurrency(product.totalSales || 0)}</td>
            <td></td>
          </tr>
        `;
      });
    }
    
    htmlContent += '</table>';
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `satis-raporu-${getPeriodLabel(selectedPeriod)}-${selectedDate}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDateInputType = () => {
    switch (selectedPeriod) {
      case 'daily': return 'date';
      case 'weekly': return 'week';
      case 'monthly': return 'month';
      default: return 'date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const summary = salesData?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    growthRate: 0
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Satış Raporları</h2>
            <p className="text-muted-foreground mt-1">Detaylı satış performans analizi</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Günlük</SelectItem>
                <SelectItem value="weekly">Haftalık</SelectItem>
                <SelectItem value="monthly">Aylık</SelectItem>
              </SelectContent>
            </Select>
            
            <input
              type={getDateInputType()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
              data-testid="input-report-date"
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export-report">
                  <Download className="w-4 h-4 mr-2" />
                  Dışa Aktar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV} data-testid="menu-export-csv">
                  <FileText className="w-4 h-4 mr-2" />
                  CSV Formatında İndir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} data-testid="menu-export-excel">
                  <FileText className="w-4 h-4 mr-2" />
                  Excel Formatında İndir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Toplam Ciro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className={`flex items-center text-xs ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {summary.growthRate >= 0 ? '+' : ''}{summary.growthRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Toplam Sipariş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {summary.totalOrders}
              </div>
              <div className="text-xs text-muted-foreground">
                {getPeriodLabel(selectedPeriod)} dönem
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Aktif Müşteri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">
                {summary.totalCustomers}
              </div>
              <div className="text-xs text-muted-foreground">
                Sipariş veren
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ortalama Sipariş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-order">
                {formatCurrency(summary.averageOrderValue)}
              </div>
              <div className="text-xs text-muted-foreground">
                Sipariş başına
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>En Çok Satan Ürünler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts?.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-sm" data-testid={`product-name-${product.id}`}>
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} adet satıldı
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm" data-testid={`product-revenue-${product.id}`}>
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Henüz satış verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales by Person */}
          <Card>
            <CardHeader>
              <CardTitle>Satış Personeli Performansı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesByPerson?.map((person: any, index: number) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-sm" data-testid={`person-name-${person.id}`}>
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.orderCount} sipariş
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm" data-testid={`person-revenue-${person.id}`}>
                        {formatCurrency(person.totalRevenue)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Henüz personel verisi bulunmuyor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Detail */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Detaylı Sipariş Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Tarih</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Sipariş No</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Müşteri</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Durum</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.orders?.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-2 text-sm" data-testid={`order-date-${order.id}`}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium" data-testid={`order-id-${order.id}`}>
                        #{order.id.slice(-8)}
                      </td>
                      <td className="py-3 px-2 text-sm" data-testid={`order-customer-${order.id}`}>
                        {order.customer?.name || order.customer?.companyName || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          data-testid={`order-status-${order.id}`}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium" data-testid={`order-amount-${order.id}`}>
                        {formatCurrency(parseFloat(order.totalAmount))}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Henüz sipariş bulunmuyor
                      </td>
                    </tr>
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