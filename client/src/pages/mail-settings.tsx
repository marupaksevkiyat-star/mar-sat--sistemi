import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertMailSettingSchema, insertMailTemplateSchema, type MailSetting, type MailTemplate } from "@shared/schema";
import { z } from "zod";
import { 
  Mail, 
  Settings, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Eye,
  Code,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// SMTP Ayarları form şeması
const smtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host gerekli"),
  port: z.string().min(1, "Port gerekli"),
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
  secure: z.boolean().default(false),
  fromEmail: z.string().email("Geçerli e-posta adresi girin"),
  fromName: z.string().min(1, "Gönderen adı gerekli"),
});

type SmtpSettings = z.infer<typeof smtpSettingsSchema>;

// Mail şablonu form şeması
const templateFormSchema = insertMailTemplateSchema.extend({
  variables: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// Template türleri
const templateTypes = [
  { value: "invoice", label: "İrsaliye" },
  { value: "order_confirmation", label: "Sipariş Onayı" },
  { value: "order_status", label: "Sipariş Durumu" },
  { value: "welcome", label: "Hoş Geldin" },
  { value: "notification", label: "Bildirim" },
  { value: "reminder", label: "Hatırlatma" },
];

// Şablon değişkenleri
const availableVariables = [
  "{{customerName}}", "{{customerEmail}}", "{{orderNumber}}", 
  "{{orderDate}}", "{{orderTotal}}", "{{products}}", 
  "{{companyName}}", "{{salesPerson}}", "{{deliveryDate}}"
];

export default function MailSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("smtp");
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // SMTP ayarları query
  const { data: smtpSettings, isLoading: loadingSmtp } = useQuery({
    queryKey: ["/api/mail-settings/smtp"],
  });

  // Mail şablonları query
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["/api/mail-templates"],
  });

  // SMTP ayarları form
  const smtpForm = useForm<SmtpSettings>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: (smtpSettings as any)?.host || "smtp.gmail.com",
      port: (smtpSettings as any)?.port || "587",
      username: (smtpSettings as any)?.username || "",
      password: (smtpSettings as any)?.password || "",
      secure: (smtpSettings as any)?.secure || false,
      fromEmail: (smtpSettings as any)?.fromEmail || "",
      fromName: (smtpSettings as any)?.fromName || "Şirket Adı",
    },
  });

  // Template form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      templateName: "",
      templateType: "invoice",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: "",
      isDefault: false,
      isActive: true,
    },
  });

  // SMTP ayarları kaydetme
  const saveSmtpSettings = useMutation({
    mutationFn: async (data: SmtpSettings) => {
      const response = await fetch("/api/mail-settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "SMTP ayarları kaydedildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-settings/smtp"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "SMTP ayarları kaydedilemedi",
        variant: "destructive",
      });
    },
  });

  // Template kaydetme/güncelleme
  const saveTemplate = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const endpoint = editingTemplate 
        ? `/api/mail-templates/${editingTemplate.id}`
        : "/api/mail-templates";
      const method = editingTemplate ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: editingTemplate ? "Şablon güncellendi" : "Şablon oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-templates"] });
      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      templateForm.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şablon kaydedilemedi",
        variant: "destructive",
      });
    },
  });

  // Template silme
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/mail-templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şablon silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-templates"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şablon silinemedi",
        variant: "destructive",
      });
    },
  });

  const onSubmitSmtp = (data: SmtpSettings) => {
    saveSmtpSettings.mutate(data);
  };

  const onSubmitTemplate = (data: TemplateFormData) => {
    saveTemplate.mutate(data);
  };

  const handleEditTemplate = (template: MailTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      templateName: template.templateName,
      templateType: template.templateType,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      variables: template.variables || "",
      isDefault: template.isDefault,
      isActive: template.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    templateForm.reset();
    setIsCreateDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const currentContent = templateForm.getValues("htmlContent");
    templateForm.setValue("htmlContent", currentContent + variable);
  };

  const previewTemplate = (template: MailTemplate) => {
    // Şablon değişkenlerini örnek verilerle değiştir
    let content = template.htmlContent;
    content = content.replace(/{{customerName}}/g, "Ahmet Yılmaz");
    content = content.replace(/{{customerEmail}}/g, "ahmet@example.com");
    content = content.replace(/{{orderNumber}}/g, "SIP-2024-001");
    content = content.replace(/{{orderDate}}/g, new Date().toLocaleDateString("tr-TR"));
    content = content.replace(/{{orderTotal}}/g, "15.250,00 ₺");
    content = content.replace(/{{companyName}}/g, "Şirket Adı");
    content = content.replace(/{{salesPerson}}/g, "Mehmet Öz");
    
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="mail-settings-page">
      <div className="flex items-center space-x-3">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mail Ayarları</h1>
          <p className="text-muted-foreground">
            E-posta ayarlarını ve şablonlarını yönetin
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="smtp" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>SMTP Ayarları</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Mail Şablonları</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>SMTP Yapılandırması</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gmail, Outlook veya özel SMTP sunucusu ayarları
              </p>
            </CardHeader>
            <CardContent>
              <Form {...smtpForm}>
                <form onSubmit={smtpForm.handleSubmit(onSubmitSmtp)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} data-testid="input-smtp-host" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} data-testid="input-smtp-port" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı / E-posta</FormLabel>
                          <FormControl>
                            <Input placeholder="your-email@gmail.com" {...field} data-testid="input-smtp-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre / App Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} data-testid="input-smtp-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gönderen E-posta</FormLabel>
                          <FormControl>
                            <Input placeholder="info@company.com" {...field} data-testid="input-from-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gönderen Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="Şirket Adı" {...field} data-testid="input-from-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={smtpForm.control}
                    name="secure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>SSL/TLS Kullan</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Güvenli bağlantı için SSL/TLS etkinleştir
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-secure"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={saveSmtpSettings.isPending}
                    className="w-full md:w-auto"
                    data-testid="button-save-smtp"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveSmtpSettings.isPending ? "Kaydediliyor..." : "SMTP Ayarlarını Kaydet"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Mail Şablonları</h2>
              <p className="text-muted-foreground">Farklı durumlarda kullanılacak mail şablonları</p>
            </div>
            <Button onClick={handleCreateTemplate} data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şablon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(templates as MailTemplate[]).map((template: MailTemplate) => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.templateName}</CardTitle>
                      <Badge variant="secondary">
                        {templateTypes.find(t => t.value === template.templateType)?.label || template.templateType}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">Varsayılan</Badge>
                      )}
                      <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                        {template.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Konu:</p>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewTemplate(template)}
                      data-testid={`button-preview-${template.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid={`button-delete-${template.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu şablonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTemplate.mutate(template.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}
            </DialogTitle>
            <DialogDescription>
              E-posta şablonunuzu oluşturun veya düzenleyin
            </DialogDescription>
          </DialogHeader>

          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="templateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şablon Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Sipariş Onay Maili" {...field} data-testid="input-template-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="templateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şablon Türü</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template-type">
                            <SelectValue placeholder="Şablon türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={templateForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mail Konusu</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Örn: Siparişiniz onaylandı - {{orderNumber}}" 
                        {...field} 
                        data-testid="input-template-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Kullanılabilir Değişkenler</Label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      data-testid={`button-variable-${variable}`}
                    >
                      <Code className="h-3 w-3 mr-1" />
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={templateForm.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML İçerik</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="<h1>Merhaba {{customerName}}</h1><p>Siparişiniz alınmıştır...</p>"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                        data-testid="textarea-html-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={templateForm.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metin İçerik (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Merhaba {{customerName}}, Siparişiniz alınmıştır..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-text-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={templateForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-default"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Varsayılan Şablon</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Aktif</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-template"
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveTemplate.isPending}
                  data-testid="button-save-template"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveTemplate.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Şablon Önizleme</DialogTitle>
            <DialogDescription>
              Şablonun nasıl görüneceğinin önizlemesi
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border rounded-lg p-4 bg-white min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}