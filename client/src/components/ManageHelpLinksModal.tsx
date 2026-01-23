import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Wifi, Sparkles, Bug, Zap, Truck, HelpCircle } from "lucide-react";
import type { HelpLink } from "@shared/schema";

interface ManageHelpLinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: "internet", label: "Internet Providers", icon: Wifi },
  { value: "cleaning", label: "Cleaning Services", icon: Sparkles },
  { value: "pest", label: "Pest Control", icon: Bug },
  { value: "utilities", label: "Utilities", icon: Zap },
  { value: "removals", label: "Removals", icon: Truck },
  { value: "other", label: "Other Services", icon: HelpCircle },
] as const;

type CategoryType = typeof CATEGORIES[number]["value"];

const getCategoryIcon = (category: string) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.icon || HelpCircle;
};

const getCategoryLabel = (category: string) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.label || "Other";
};

export function ManageHelpLinksModal({ open, onOpenChange }: ManageHelpLinksModalProps) {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "internet" as CategoryType,
    businessName: "",
    description: "",
    url: "",
  });

  const { data: helpLinks = [], isLoading } = useQuery<HelpLink[]>({
    queryKey: ["/api/help-links"],
    queryFn: async () => {
      const res = await fetch("/api/help-links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch help links");
      return res.json();
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/help-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create help link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-links"] });
      resetForm();
      toast({ title: "Link added", description: "Help link has been created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create help link.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/help-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update help link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-links"] });
      resetForm();
      toast({ title: "Link updated", description: "Help link has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update help link.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/help-links/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete help link");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-links"] });
      toast({ title: "Link deleted", description: "Help link has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete help link.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({ category: "internet", businessName: "", description: "", url: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.url.trim()) {
      toast({ title: "Error", description: "Business name and URL are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (link: HelpLink) => {
    setEditingId(link.id);
    setIsAddingNew(true);
    setFormData({
      category: link.category as CategoryType,
      businessName: link.businessName,
      description: link.description || "",
      url: link.url,
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const groupedLinks = CATEGORIES.map(cat => ({
    ...cat,
    links: helpLinks.filter(link => link.category === cat.value),
  })).filter(cat => cat.links.length > 0);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">Manage Help Links</DialogTitle>
          <DialogDescription>
            Add and manage service provider links that your clients can access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isAddingNew ? (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as CategoryType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g., BT Broadband"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Website URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the service..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Update Link" : "Add Link"}
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setIsAddingNew(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Help Link
            </Button>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : helpLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No help links configured yet.</p>
              <p className="text-sm">Add links to service providers that your clients can use.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedLinks.map(category => {
                const Icon = category.icon;
                return (
                  <div key={category.value} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </div>
                    <div className="space-y-2">
                      {category.links.map(link => (
                        <Card key={link.id} className="border-slate-200">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{link.businessName}</span>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              {link.description && (
                                <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(link)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteMutation.mutate(link.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
