import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/login", { username, password });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Giriş Hatası",
        description: "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-industry text-2xl text-primary-foreground"></i>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Üretim Yönetim Sistemi</h1>
            <p className="text-muted-foreground mt-2">Hesabınıza giriş yapın</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                data-testid="input-username"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                required
                data-testid="input-password"
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Satış • Üretim • Sevkiyat • Yönetim</p>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium mb-2">Kullanılabilir Hesaplar:</p>
              <div className="grid grid-cols-2 gap-1 text-left">
                <div>
                  <p><strong>Admin:</strong> admin / 1234</p>
                  <p><strong>Satış Müdürü:</strong> ahmet / 1234</p>
                  <p><strong>Satış Personeli:</strong> ayse / 1234</p>
                  <p><strong>Üretim Müdürü:</strong> mehmet / 1234</p>
                  <p><strong>Üretim Personeli:</strong> zeynep / 1234</p>
                </div>
                <div>
                  <p><strong>Muhasebe Müdürü:</strong> ali / 1234</p>
                  <p><strong>Muhasebe Personeli:</strong> elif / 1234</p>
                  <p><strong>Sevkiyat Müdürü:</strong> fatma / 1234</p>
                  <p><strong>Sevkiyat Personeli:</strong> murat / 1234</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
