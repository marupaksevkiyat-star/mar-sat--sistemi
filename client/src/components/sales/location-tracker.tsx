import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, RefreshCw, Plus } from "lucide-react";

interface LocationTrackerProps {
  onLocationUpdate: (location: { lat: number; lng: number } | null) => void;
  nearbyCustomers?: any[];
  onSelectCustomer: (customer: any) => void;
  onNewCustomer: () => void;
  isLoading?: boolean;
}

export default function LocationTracker({
  onLocationUpdate,
  nearbyCustomers = [],
  onSelectCustomer,
  onNewCustomer,
  isLoading = false,
}: LocationTrackerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Bu tarayıcı konum desteği sağlamıyor");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        onLocationUpdate(newLocation);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Konum alınamadı";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Konum izni reddedildi";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Konum bilgisi kullanılamıyor";
            break;
          case error.TIMEOUT:
            errorMessage = "Konum alma zaman aşımına uğradı";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const calculateDistance = (customer: any) => {
    if (!location || !customer.latitude || !customer.longitude) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (parseFloat(customer.latitude) - location.lat) * Math.PI / 180;
    const dLon = (parseFloat(customer.longitude) - location.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location.lat * Math.PI / 180) * Math.cos(parseFloat(customer.latitude) * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Yeni Ziyaret</CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            {location ? (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <MapPin className="w-3 h-3 mr-1" />
                Konum Aktif
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <MapPin className="w-3 h-3 mr-1" />
                Konum Yok
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GPS Location Display */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="text-primary mt-1 w-4 h-4" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Mevcut Konumunuz</p>
              {isGettingLocation ? (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-muted-foreground">Konum alınıyor...</span>
                </div>
              ) : locationError ? (
                <p className="text-xs text-destructive mt-1">{locationError}</p>
              ) : location ? (
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-current-location">
                  {formatLocation(location.lat, location.lng)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Konum bilgisi yok</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              data-testid="button-refresh-location"
            >
              <RefreshCw className={`w-4 h-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Nearby Customers */}
        <div>
          <h4 className="font-medium text-foreground mb-3">Yakındaki Müşteriler</h4>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="w-4 h-4" />
                </div>
              ))}
            </div>
          ) : nearbyCustomers.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-lg">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {location ? "Yakında müşteri bulunamadı" : "Konum aktif değil"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onSelectCustomer(customer)}
                  data-testid={`customer-nearby-${customer.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      customer.status === 'active' ? 'bg-blue-100' : 
                      customer.status === 'potential' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <i className={`fas ${
                        customer.status === 'active' ? 'fa-building text-blue-600' :
                        customer.status === 'potential' ? 'fa-store text-green-600' :
                        'fa-building text-gray-600'
                      } text-sm`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm" data-testid={`customer-name-${customer.id}`}>
                        {customer.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`customer-distance-${customer.id}`}>
                        {calculateDistance(customer) || 'Mesafe hesaplanamadı'}
                      </p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={onNewCustomer} 
          className="w-full" 
          data-testid="button-add-new-customer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Müşteri Ekle
        </Button>
      </CardContent>
    </Card>
  );
}
