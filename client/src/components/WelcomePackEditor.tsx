import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  useWelcomePack,
  useCreateWelcomePackItem,
  useUpdateWelcomePackItem,
  useDeleteWelcomePackItem,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from "@/hooks/use-welcome-pack";
import type { WelcomePackItem, WelcomePackField } from "@shared/schema";

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

interface WelcomePackEditorProps {
  propertyId: string;
}

export function WelcomePackEditor({ propertyId }: WelcomePackEditorProps) {
  const { data: items = [], isLoading } = useWelcomePack(propertyId);
  const createMutation = useCreateWelcomePackItem();
  const updateMutation = useUpdateWelcomePackItem();
  const deleteMutation = useDeleteWelcomePackItem();

  const [editingItem, setEditingItem] = useState<WelcomePackItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: "custom" as string,
    title: "",
    description: "",
    icon: "file-text",
    fields: [] as WelcomePackField[],
  });

  const resetForm = () => {
    setFormData({
      category: "custom",
      title: "",
      description: "",
      icon: "file-text",
      fields: [],
    });
  };

  const openEditDialog = (item: WelcomePackItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      title: item.title,
      description: item.description || "",
      icon: item.icon,
      fields: item.fields || [],
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleAddField = () => {
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, { label: "", value: "", copyable: false }],
    }));
  };

  const handleRemoveField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleFieldChange = (index: number, key: keyof WelcomePackField, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) =>
        i === index ? { ...f, [key]: value } : f
      ),
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          itemId: editingItem.id,
          propertyId,
          data: {
            category: formData.category,
            title: formData.title,
            description: formData.description || null,
            icon: formData.icon,
            fields: formData.fields,
          },
        });
        toast({ title: "Saved", description: "Welcome pack item updated" });
      } else {
        await createMutation.mutateAsync({
          propertyId,
          data: {
            category: formData.category,
            title: formData.title,
            description: formData.description,
            icon: formData.icon,
            fields: formData.fields,
            orderIndex: items.length,
          },
        });
        toast({ title: "Created", description: "Welcome pack item added" });
      }
      setEditingItem(null);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteMutation.mutateAsync({ itemId, propertyId });
      toast({ title: "Deleted", description: "Welcome pack item removed" });
      setDeleteConfirm(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Welcome Pack</h3>
          <p className="text-sm text-muted-foreground">
            Information shown to tenants when they move in
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm" data-testid="button-add-welcome-pack-item">
          <Plus className="h-4 w-4 mr-1" /> Add Section
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="relative group" data-testid={`welcome-pack-item-${item.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
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
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(item)}
                    data-testid={`button-edit-welcome-pack-${item.id}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm(item.id)}
                    data-testid={`button-delete-welcome-pack-${item.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {item.description && (
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
              )}
              {item.fields && item.fields.length > 0 && (
                <div className="space-y-2">
                  {item.fields.map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className={cn("font-medium", !field.value && "text-muted-foreground italic")}>
                        {field.value || "Not set"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(!item.fields || item.fields.length === 0) && !item.description && (
                <p className="text-sm text-muted-foreground italic">No details added yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No welcome pack items yet</p>
            <Button variant="outline" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" /> Add First Section
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editingItem || isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null);
          setIsAddDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Section" : "Add Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v, icon: CATEGORY_ICONS[v] || "file-text" }))}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., WiFi Information"
                data-testid="input-title"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description for tenants"
                rows={2}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddField} data-testid="button-add-field">
                  <Plus className="h-3 w-3 mr-1" /> Add Field
                </Button>
              </div>
              {formData.fields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-muted/30 p-3 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Label (e.g., Network Name)"
                      value={field.label}
                      onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                      className="h-8 text-sm"
                      data-testid={`input-field-label-${idx}`}
                    />
                    <Input
                      placeholder="Value (e.g., MyWiFi_5G)"
                      value={field.value}
                      onChange={(e) => handleFieldChange(idx, "value", e.target.value)}
                      className="h-8 text-sm"
                      data-testid={`input-field-value-${idx}`}
                    />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.copyable || false}
                        onChange={(e) => handleFieldChange(idx, "copyable", e.target.checked)}
                        className="rounded"
                      />
                      Allow copy to clipboard
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => handleRemoveField(idx)}
                    data-testid={`button-remove-field-${idx}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {formData.fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Add fields to show specific information like passwords, contact numbers, etc.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingItem(null); setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-welcome-pack"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Section?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove this section from the welcome pack. Tenants will no longer see it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
