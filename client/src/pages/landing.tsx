import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
          
          <Button 
            onClick={handleLogin}
            className="w-full"
            data-testid="button-login"
          >
            Replit ile Giriş Yap
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Satış • Üretim • Sevkiyat • Yönetim</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
