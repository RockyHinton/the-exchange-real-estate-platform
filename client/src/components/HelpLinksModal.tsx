import { useState } from "react";
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
import { HELP_SERVICES } from "@/lib/mockData";
import { 
  Wifi, 
  Sparkles, 
  Bug, 
  Zap, 
  Truck, 
  Search, 
  ExternalLink, 
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICONS: Record<string, any> = {
  wifi: Wifi,
  sparkles: Sparkles,
  bug: Bug,
  zap: Zap,
  truck: Truck
};

export function HelpLinksModal({ open, onOpenChange }: HelpLinksModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<typeof HELP_SERVICES[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = HELP_SERVICES.filter(cat => 
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {selectedCategory ? selectedCategory.title : "Help & Services"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {selectedCategory 
              ? "Select a provider below to view their services."
              : "Find trusted service providers for your home."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-slate-50 min-h-[400px]">
          {!selectedCategory ? (
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
                  const Icon = ICONS[service.icon] || Zap;
                  return (
                    <Card 
                      key={service.id} 
                      className="cursor-pointer hover:shadow-md transition-all hover:border-slate-300 border-slate-200 group"
                      onClick={() => setSelectedCategory(service)}
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
              {selectedCategory.links.map((link, idx) => (
                <Card key={idx} className="group hover:border-blue-200 transition-colors bg-white border-slate-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                        {link.title}
                        <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">{link.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-blue-600">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-medium mb-1">Disclaimer</p>
                These are third-party services recommended by The Exchange. We are not responsible for their service quality or availability.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}