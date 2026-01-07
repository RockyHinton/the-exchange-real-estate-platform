import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Mail, Phone, Plus, User, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/lib/mockData";

interface ClientDetailsCardProps {
  initialClients: Client[];
}

interface ExtendedClient extends Client {
  isPrimary?: boolean;
  notes?: string;
}

export function ClientDetailsCard({ initialClients }: ClientDetailsCardProps) {
  // Initialize state with the mock client as primary
  const [clients, setClients] = useState<ExtendedClient[]>(
    initialClients.map((c, i) => ({ ...c, isPrimary: i === 0 }))
  );
  
  const [selectedClient, setSelectedClient] = useState<ExtendedClient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ExtendedClient>>({});

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

  const handleDelete = () => {
    if (!selectedClient) return;
    
    if (clients.length <= 1) {
      toast({
        title: "Cannot delete client",
        description: "You must have at least one client attached to the property.",
        variant: "destructive"
      });
      return;
    }

    if (confirm("Are you sure you want to delete this client?")) {
      const newClients = clients.filter(c => c.id !== selectedClient.id);
      
      // If we deleted the primary client, assign primary to the first available
      if (selectedClient.isPrimary && newClients.length > 0) {
        newClients[0].isPrimary = true;
      }
      
      setClients(newClients);
      setIsModalOpen(false);
      toast({ title: "Client removed" });
    }
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
      const newClient: ExtendedClient = {
        id: `c_${Date.now()}`,
        name: formData.name!,
        email: formData.email!,
        phone: formData.phone || "",
        avatar: "", // Placeholder
        isPrimary: formData.isPrimary || false,
        notes: formData.notes
      };
      newClients.push(newClient);
    }

    // Sort: Primary first, then alphabetical
    newClients.sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.name.localeCompare(b.name);
    });

    setClients(newClients);
    setIsModalOpen(false);
    toast({ 
      title: isEditing ? "Client updated" : "Client added",
      description: `${formData.name} has been ${isEditing ? 'updated' : 'added'} successfully.`
    });
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
                 onClick={handleDelete}
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
    </>
  );
}
