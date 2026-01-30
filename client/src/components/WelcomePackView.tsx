import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Copy,
  Check,
  Wifi,
  Thermometer,
  Trash,
  Phone,
  ClipboardList,
  MapPin,
  Home,
  FileText,
  Package,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWelcomePack, CATEGORY_LABELS } from "@/hooks/use-welcome-pack";
import { toast } from "@/hooks/use-toast";
import type { WelcomePackItem } from "@shared/schema";

const ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-5 w-5" />,
  thermometer: <Thermometer className="h-5 w-5" />,
  "trash-2": <Trash className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  "clipboard-list": <ClipboardList className="h-5 w-5" />,
  "map-pin": <MapPin className="h-5 w-5" />,
  home: <Home className="h-5 w-5" />,
  "file-text": <FileText className="h-5 w-5" />,
};

interface WelcomePackViewProps {
  propertyId: string;
}

export function WelcomePackView({ propertyId }: WelcomePackViewProps) {
  const { data: items = [], isLoading } = useWelcomePack(propertyId);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      toast({ title: "Copied!", description: "Value copied to clipboard" });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const filledItems = items.filter(
    (item) => item.fields && item.fields.some((f) => f.value && f.value.trim() !== "")
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filledItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Welcome Pack</h3>
          <p className="text-muted-foreground">
            Your agent hasn't added welcome pack information yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-serif font-semibold">Welcome Pack</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Important information about your property from your agent
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filledItems.map((item) => (
          <Card key={item.id} className="overflow-hidden" data-testid={`welcome-pack-view-${item.id}`}>
            <CardHeader className="pb-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {ICON_MAP[item.icon] || <FileText className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {item.description && (
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              )}
              {item.fields && item.fields.length > 0 && (
                <div className="space-y-3">
                  {item.fields
                    .filter((field) => field.value && field.value.trim() !== "")
                    .map((field, idx) => {
                      const fieldKey = `${item.id}-${idx}`;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
                            <p className="text-sm font-medium truncate">{field.value}</p>
                          </div>
                          {field.copyable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 ml-2"
                              onClick={() => handleCopy(field.value, fieldKey)}
                              data-testid={`button-copy-${item.id}-${idx}`}
                            >
                              {copiedField === fieldKey ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
