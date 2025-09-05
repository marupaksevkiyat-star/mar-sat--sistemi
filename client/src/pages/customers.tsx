import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Plus, Search, Edit, Trash2, Building, MapPin, Phone, Mail, User, Pause } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  status: 'potential' | 'active' | 'inactive';
  notes?: string;
  latitude?: string;
  longitude?: string;
  createdAt?: string;
}

export default function Customers() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Müşteri verileri
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    enabled: isAuthenticated,
  });

  const customersArray = Array.isArray(customers) ? customers : [];

  // Müşteri silme mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Başarılı",
        description: "Müşteri silindi",
      });
    },
    onError: (error: any) => {
      console.error('Delete customer error:', error);
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Müşteri güncelleme mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<Customer>) => {
      const response = await fetch(`/api/customers/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      toast({
        title: "Başarılı",
        description: "Müşteri güncellendi",
      });
    },
    onError: (error: any) => {
      console.error('Update customer error:', error);
      toast({
        title: "Hata",
        description: "Müşteri güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Müşteri pasife alma mutation
  const deactivateCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}/deactivate`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Başarılı",
        description: "Müşteri pasife alındı",
      });
    },
    onError: (error: any) => {
      console.error('Deactivate customer error:', error);
      toast({
        title: "Hata",
        description: "Müşteri pasife alınırken bir hata oluştu",
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

  // Filtreleme
  const filteredCustomers = customersArray.filter((customer: Customer) => {
    const matchesSearch = 
      customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>;
      case 'potential':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Potansiyel</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pasif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Bu müşteriyi ve TÜM ilişkili verilerini (siparişler, ziyaretler, randevular) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleDeactivateCustomer = (customerId: string) => {
    if (window.confirm('Bu müşteriyi pasife almak istediğinizden emin misiniz? Müşteri verileriniz korunacak ancak müşteri listesinde görünmeyecek.')) {
      deactivateCustomerMutation.mutate(customerId);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate(editingCustomer);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Müşteri Yönetimi</h2>
          <p className="text-muted-foreground mt-1">Tüm müşteri bilgilerini görüntüleyin ve yönetin</p>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Arama</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Firma, kişi, e-posta veya telefon ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <div className="sm:w-48">
                <Label htmlFor="status-filter">Durum</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="potential">Potansiyel</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam</p>
                  <p className="text-2xl font-bold">{customersArray.length}</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">
                    {customersArray.filter((c: Customer) => c.status === 'active').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potansiyel</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customersArray.filter((c: Customer) => c.status === 'potential').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pasif</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {customersArray.filter((c: Customer) => c.status === 'inactive').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Müşteri Listesi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Müşteri Listesi</span>
              <Badge variant="outline">{filteredCustomers.length} müşteri</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Müşteriler yükleniyor...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Müşteri bulunamadı</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "Arama kriterlerinize uygun müşteri bulunamadı" 
                    : "Henüz müşteri kaydı bulunmuyor"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCustomers.map((customer: Customer) => (
                  <div key={customer.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-foreground">{customer.companyName}</h4>
                          {getStatusBadge(customer.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{customer.contactPerson}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{customer.district}, {customer.city}</span>
                          </div>
                        </div>
                        
                        {customer.notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Not:</strong> {customer.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/appointments?customer=${customer.id}`}
                          className="text-blue-600 hover:text-blue-700 border-blue-300"
                          data-testid={`button-appointment-${customer.id}`}
                          title="Randevu Ver"
                        >
                          📅
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          data-testid={`button-edit-${customer.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateCustomer(customer.id)}
                          className="text-orange-600 hover:text-orange-700"
                          data-testid={`button-deactivate-${customer.id}`}
                          title="Pasife Al"
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${customer.id}`}
                          title="Kalıcı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Müşteri Düzenleme Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
            </DialogHeader>
            
            {editingCustomer && (
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Firma Adı *</Label>
                    <Input
                      id="companyName"
                      value={editingCustomer.companyName}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        companyName: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPerson">İletişim Kişisi *</Label>
                    <Input
                      id="contactPerson"
                      value={editingCustomer.contactPerson}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        contactPerson: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        email: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        phone: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Şehir</Label>
                    <Input
                      id="city"
                      value={editingCustomer.city}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        city: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={editingCustomer.district}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        district: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={editingCustomer.status}
                    onValueChange={(value: 'potential' | 'active' | 'inactive') => 
                      setEditingCustomer({
                        ...editingCustomer,
                        status: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potential">Potansiyel</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Textarea
                    id="address"
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      address: e.target.value
                    })}
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={editingCustomer.notes || ''}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      notes: e.target.value
                    })}
                    rows={2}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCustomerMutation.isPending}
                    className="flex-1"
                  >
                    {updateCustomerMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}