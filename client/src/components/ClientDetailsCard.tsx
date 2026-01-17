import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/lib/mockData";
import { sharedStore } from "@/lib/sharedStore"; // Import sharedStore

interface ClientDetailsCardProps {
  initialClients: Client[];
  propertyId?: string; // Add propertyId prop
  onDeleteClient?: (clientId: string) => void;
}

interface ExtendedClient extends Client {
  isPrimary?: boolean;
  notes?: string;
}

export function ClientDetailsCard({ initialClients, propertyId = 'p1', onDeleteClient }: ClientDetailsCardProps) {
  // Initialize state with the mock client as primary
  const [clients, setClients] = useState<ExtendedClient[]>(
    initialClients.map((c, i) => ({ ...c, isPrimary: i === 0 }))
  );
  
  const [selectedClient, setSelectedClient] = useState<ExtendedClient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ExtendedClient>>({});

  // Sync with store to catch externally added clients (e.g. from persistence or other components)
  useEffect(() => {
    const syncClientsFromStore = () => {
      const docs = sharedStore.getPropertyDocuments(propertyId);
      setClients(currentClients => {
        const existingIds = new Set(currentClients.map(c => c.id));
        const newClientsFromDocs: ExtendedClient[] = [];

        docs.forEach(doc => {
          if (doc.clientId && !existingIds.has(doc.clientId)) {
            // Check if we already staged this client to add
            if (!newClientsFromDocs.find(c => c.id === doc.clientId)) {
              newClientsFromDocs.push({
                id: doc.clientId,
                name: doc.clientName || "Unknown Client",
                email: "", // Information not persisted in document store
                phone: "", 
                avatar: "",
                isPrimary: false,
                notes: "Restored from documents"
              });
            }
          }
        });

        if (newClientsFromDocs.length > 0) {
          return [...currentClients, ...newClientsFromDocs];
        }
        return currentClients;
      });
    };

    // Initial sync
    syncClientsFromStore();

    // Subscribe to changes
    return sharedStore.subscribe(syncClientsFromStore);
  }, [propertyId]);

  const handleAddClick = () => {
    setFormData({
      isPrimary: clients.length === 0 // Default to primary if it's the first client
    });
    setSelectedClient(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (client: ExtendedClient) => {
    setFormData({ ...client });
    setSelectedClient(client);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (!selectedClient) return;
    
    // Allow deleting even if it's the last one, but show specific warning in executeDelete dialog content
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (!selectedClient) return;

    const newClients = clients.filter(c => c.id !== selectedClient.id);
    
    // If we deleted the primary client, assign primary to the first available
    if (selectedClient.isPrimary && newClients.length > 0) {
      newClients[0].isPrimary = true;
    }
    
    // Remove documents from store
    sharedStore.removeDocumentsForClient(propertyId, selectedClient.id);
    
    // If no clients left, update property stage to Empty
    if (newClients.length === 0) {
       sharedStore.updatePropertyStage(propertyId, 'Empty');
       toast({ title: "Tenancy Ended", description: "All clients removed. Property is now Empty." });
    } else {
       toast({ title: "Client removed" });
    }

    // Notify parent if callback provided
    if (onDeleteClient) {
      onDeleteClient(selectedClient.id);
    }
    
    setClients(newClients);
    setIsModalOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Name and email are required.",
        variant: "destructive"
      });
      return;
    }

    let newClients = [...clients];

    // Handle Primary Applicant Exclusivity
    if (formData.isPrimary) {
      newClients = newClients.map(c => ({ ...c, isPrimary: false }));
    }

    if (isEditing && selectedClient) {
      // Update existing
      newClients = newClients.map(c => 
        c.id === selectedClient.id ? { ...c, ...formData } as ExtendedClient : c
      );
      
      // Ensure at least one primary exists if we just unset it (fallback to first)
      if (!newClients.some(c => c.isPrimary) && newClients.length > 0) {
         newClients[0].isPrimary = true;
      }
      
    } else {
      // Add new
      const newClientId = `c_${Date.now()}`;
      const newClient: ExtendedClient = {
        id: newClientId,
        name: formData.name!,
        email: formData.email!,
        phone: formData.phone || "",
        avatar: "", // Placeholder
        isPrimary: formData.isPrimary || false,
        notes: formData.notes
      };
      newClients.push(newClient);

      // Trigger automatic document creation
      sharedStore.addDocumentsForClient(propertyId, newClientId, newClient.name);
      
      // If property was empty (0 clients before this), update stage to Awaiting Documents
      if (clients.length === 0) {
        sharedStore.updatePropertyStage(propertyId, 'Awaiting Documents');
      }

      toast({ 
        title: "Client added & Checklist created",
        description: `Default documents have been added for ${newClient.name}.`
      });
    }

    // Sort: Primary first, then alphabetical
    newClients.sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.name.localeCompare(b.name);
    });

    setClients(newClients);
    setIsModalOpen(false);
    if (isEditing) {
      toast({ 
        title: "Client updated",
        description: `${formData.name} has been updated successfully.`
      });
    }
  };

  return (
    <>
      <Card className="bg-white border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-serif">Client Details</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col gap-2">
            {clients.map((client) => (
              <div 
                key={client.id}
                onClick={() => handleEditClick(client)}
                className="group flex items-center justify-between p-3 rounded-md border border-transparent hover:border-border/60 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback className="bg-slate-100 text-xs">{client.name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{client.name}</span>
                      {client.isPrimary && (
                        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          Lead
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {client.email && <span className="truncate">{client.email}</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Client Details" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 7000 000000"
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md bg-slate-50/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Primary Applicant</Label>
                <p className="text-xs text-muted-foreground">
                  This client will receive all main correspondence.
                </p>
              </div>
              <Switch
                checked={formData.isPrimary || false}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Private Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal agent notes..."
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between items-center gap-2">
             {isEditing ? (
               <Button 
                 variant="ghost" 
                 onClick={handleDeleteClick}
                 className="text-red-500 hover:text-red-600 hover:bg-red-50 mr-auto px-2"
               >
                 <Trash2 className="h-4 w-4 mr-1.5" />
                 Delete
               </Button>
             ) : (
               <div /> /* Spacer */
             )}
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSave}>{isEditing ? "Save Changes" : "Add Client"}</Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              {clients.length === 1 ? "End Tenancy?" : "Delete Client?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clients.length === 1 ? (
                <>
                  You are removing the last client from this property. This will mark the property as <strong>Empty</strong> and end the current tenancy. All documents will be removed.
                </>
              ) : (
                <>
                  This will permanently remove <strong>{selectedClient?.name}</strong> from this property. 
                  All associated documents and checklist items will also be deleted. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {clients.length === 1 ? "End Tenancy & Empty Property" : "Delete Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
