import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wifi, 
  Sparkles, 
  Bug, 
  Zap, 
  Truck, 
  Search, 
  ExternalLink, 
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  Loader2
} from "lucide-react";
import type { HelpLink } from "@shared/schema";

interface HelpLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_CONFIG = {
  internet: { icon: Wifi, title: "Internet Providers", description: "Broadband and internet services" },
  cleaning: { icon: Sparkles, title: "Cleaning Services", description: "Professional cleaning providers" },
  pest: { icon: Bug, title: "Pest Control", description: "Pest control services" },
  utilities: { icon: Zap, title: "Utilities", description: "Gas, electric, and water providers" },
  removals: { icon: Truck, title: "Removals", description: "Moving and removal services" },
  other: { icon: HelpCircle, title: "Other Services", description: "Additional helpful services" },
} as const;

type CategoryType = keyof typeof CATEGORY_CONFIG;

export function HelpLinksModal({ open, onOpenChange }: HelpLinksModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: helpLinks = [], isLoading } = useQuery<HelpLink[]>({
    queryKey: ["/api/client/help-links"],
    queryFn: async () => {
      const res = await fetch("/api/client/help-links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch help links");
      return res.json();
    },
    enabled: open,
  });

  const groupedLinks = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
    id: key as CategoryType,
    ...config,
    links: helpLinks.filter(link => link.category === key),
  })).filter(cat => cat.links.length > 0);

  const filteredCategories = groupedLinks.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = selectedCategory 
    ? groupedLinks.find(c => c.id === selectedCategory)
    : null;

  const handleClose = () => {
    onOpenChange(false);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="-ml-2 h-8 w-8 rounded-full" 
                onClick={() => setSelectedCategory(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl font-serif">
              {selectedCategoryData ? selectedCategoryData.title : "Help & Services"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {selectedCategoryData 
              ? "Select a provider below to view their services."
              : "Find trusted service providers for your home."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-slate-50 min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : groupedLinks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No help links available yet.</p>
              <p className="text-sm">Your agent hasn't configured any service providers.</p>
            </div>
          ) : !selectedCategory ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search for services (e.g. cleaning, wifi)..." 
                  className="pl-9 bg-white border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCategories.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Card 
                      key={service.id} 
                      className="cursor-pointer hover:shadow-md transition-all hover:border-slate-300 border-slate-200 group"
                      onClick={() => setSelectedCategory(service.id)}
                      data-testid={`card-help-category-${service.id}`}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors shrink-0">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredCategories.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-500">
                    No services found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCategoryData?.links.map((link) => (
                <a 
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid={`link-help-${link.id}`}
                >
                  <Card className="group hover:border-blue-200 transition-colors bg-white border-slate-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                          {link.businessName}
                          <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        {link.description && (
                          <p className="text-sm text-slate-500 mt-1">{link.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-blue-600">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </a>
              ))}
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-medium mb-1">Disclaimer</p>
                These are third-party services recommended by your agent. We are not responsible for their service quality or availability.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
