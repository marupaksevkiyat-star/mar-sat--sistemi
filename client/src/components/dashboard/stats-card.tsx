import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  subtitle?: string;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple" | "red" | "cyan" | "orange" | "emerald";
  isLoading?: boolean;
  "data-testid"?: string;
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "positive",
  subtitle,
  icon,
  color,
  isLoading = false,
  "data-testid": testId,
  onClick,
}: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600", 
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
    cyan: "bg-cyan-100 text-cyan-600",
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  if (isLoading) {
    return (
      <Card data-testid={testId}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
          <div className="mt-4 flex items-center space-x-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''}`} 
      data-testid={testId}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid={`${testId}-value`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} text-xl`}></i>
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-sm">
          {change && (
            <>
              <i className={`fas fa-arrow-${changeType === "positive" ? "up" : "down"} mr-1 ${
                changeType === "positive" ? "text-green-500" : "text-red-500"
              }`}></i>
              <span className={changeType === "positive" ? "text-green-600" : "text-red-600"}>
                {change}
              </span>
              <span className="text-muted-foreground ml-1">önceki haftaya göre</span>
            </>
          )}
          {subtitle && !change && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
