import { Badge } from "@/components/ui/badge";

interface ProductionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    pending: number;
    active: number;
    completed: number;
  };
}

export default function ProductionTabs({ activeTab, onTabChange, counts }: ProductionTabsProps) {
  const tabs = [
    { 
      id: "pending", 
      label: "Bekleyen Siparişler", 
      count: counts.pending,
      testId: "tab-pending"
    },
    { 
      id: "active", 
      label: "Üretimde", 
      count: counts.active,
      testId: "tab-active"
    },
    { 
      id: "completed", 
      label: "Tamamlanan", 
      count: counts.completed,
      testId: "tab-completed"
    },
  ];

  return (
    <div className="mb-6">
      <nav className="flex space-x-8 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={tab.testId}
          >
            <span>{tab.label}</span>
            <Badge 
              variant="secondary" 
              className={activeTab === tab.id ? "bg-primary text-primary-foreground" : ""}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </nav>
    </div>
  );
}
