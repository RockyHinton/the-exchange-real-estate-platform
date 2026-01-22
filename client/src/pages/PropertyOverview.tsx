import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  ArrowLeft, 
  MapPin, 
  MessageSquare, 
  User,
  Users,
  Mail,
  Phone,
  Loader2,
  Edit,
  Trash2,
  Plus,
  X
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { 
  useProperty, 
  useUpdateProperty, 
  useDeleteProperty,
  usePropertyClients,
  useAddPropertyClient,
  useRemovePropertyClient,
  type PropertyClientWithUser
} from "@/hooks/use-properties";
import { useAuth } from "@/hooks/use-auth";

export default function PropertyOverview() {
  const [, params] = useRoute("/agent/property/:id");
  const [, setLocation] = useLocation();
  const { data: property, isLoading, error } = useProperty(params?.id);
  const { data: propertyClients = [], isLoading: clientsLoading } = usePropertyClients(params?.id);
  const { user } = useAuth();
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  const addClientMutation = useAddPropertyClient();
  const removeClientMutation = useRemovePropertyClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    price: "",
  });
  const [newClientForm, setNewClientForm] = useState({
    clientEmail: "",
    clientName: "",
    clientPhone: "",
    clientDateOfBirth: "",
  });

  const getStageFromLifecycle = (status: string): string => {
    switch (status) {
      case "onboarding_in_progress": return "Awaiting Documents";
      case "onboarding_ready_to_confirm": return "In Review";
      case "approved_active_tenancy": return "Approved";
      default: return "Empty";
    }
  };

  const getOverallStage = () => {
    if (propertyClients.length === 0) return "Empty";
    const allApproved = propertyClients.every(c => c.lifecycleStatus === "approved_active_tenancy");
    const anyInReview = propertyClients.some(c => c.lifecycleStatus === "onboarding_ready_to_confirm");
    if (allApproved) return "Approved";
    if (anyInReview) return "In Review";
    return "Awaiting Documents";
  };

  const currentStage = getOverallStage();

  if (isLoading) {
    return (
      <Layout userType="agent">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout userType="agent">
        <div className="text-center py-24">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/agent">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

  const handleOpenEditDialog = () => {
    setEditForm({
      price: property.price || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenAddClientDialog = () => {
    setNewClientForm({ clientEmail: "", clientName: "", clientPhone: "", clientDateOfBirth: "" });
    setIsAddClientDialogOpen(true);
  };

  const handleAddClient = async () => {
    if (!newClientForm.clientEmail) {
      toast({
        title: "Error",
        description: "Client email is required",
        variant: "destructive",
      });
      return;
    }

    if (!newClientForm.clientName) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await addClientMutation.mutateAsync({
        propertyId: property.id,
        data: {
          clientEmail: newClientForm.clientEmail,
          clientName: newClientForm.clientName,
          clientPhone: newClientForm.clientPhone || undefined,
          clientDateOfBirth: newClientForm.clientDateOfBirth ? new Date(newClientForm.clientDateOfBirth).toISOString() : undefined,
        },
      });
      setIsAddClientDialogOpen(false);
      toast({
        title: "Client Registered",
        description: "The client can now log in with their email to access this property.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add client",
        variant: "destructive",
      });
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    try {
      await removeClientMutation.mutateAsync({
        propertyId: property.id,
        clientId,
      });
      toast({
        title: "Client Removed",
        description: "The client has been removed from this property.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove client",
        variant: "destructive",
      });
    }
  };

  const getClientDisplayName = (client: PropertyClientWithUser): string => {
    if (client.user?.firstName && client.user?.lastName) {
      return `${client.user.firstName} ${client.user.lastName}`;
    }
    return client.clientName || client.clientEmail;
  };

  const getClientInitials = (client: PropertyClientWithUser): string => {
    const name = getClientDisplayName(client);
    return name.substring(0, 2).toUpperCase();
  };

  const handleUpdateProperty = async () => {
    try {
      await updatePropertyMutation.mutateAsync({
        id: property.id,
        data: {
          price: editForm.price || undefined,
        },
      });
      setIsEditDialogOpen(false);
      toast({
        title: "Property Updated",
        description: "The property has been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update property",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async () => {
    try {
      await deletePropertyMutation.mutateAsync(property.id);
      toast({
        title: "Property Deleted",
        description: "The property has been removed.",
      });
      setLocation("/agent");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agent">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">{property.address}</h1>
              <div className="flex items-center text-muted-foreground text-sm mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {property.city}, {property.postcode}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={currentStage as any} />
            <Button variant="outline" size="sm" onClick={handleOpenEditDialog} data-testid="button-edit-property">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-property"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img 
                  src={property.imageUrl || defaultImage} 
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-lg font-semibold">{property.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold capitalize">{property.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lifecycle</p>
                    <p className="text-lg font-semibold">{currentStage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Guarantor Required</p>
                    <p className="text-lg font-semibold">{property.guarantorRequired ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Property Documents</CardTitle>
                <CardDescription>Documents uploaded by the client will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documents uploaded yet</p>
                  <p className="text-sm mt-1">Once a client is assigned and uploads documents, they will appear here for review.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Clients ({propertyClients.length})
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenAddClientDialog}
                    data-testid="button-add-client"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : propertyClients.length > 0 ? (
                  <div className="space-y-3">
                    {propertyClients.map((client) => (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        data-testid={`client-card-${client.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={client.user?.profileImageUrl || undefined} />
                            <AvatarFallback>{getClientInitials(client)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{getClientDisplayName(client)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{client.clientEmail}</span>
                            </div>
                            <div className="mt-1">
                              <StatusBadge status={getStageFromLifecycle(client.lifecycleStatus) as any} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!client.userId && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              Pending
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveClient(client.id)}
                            disabled={removeClientMutation.isPending}
                            data-testid={`button-remove-client-${client.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground mb-3">No clients assigned</p>
                    <Button variant="outline" size="sm" onClick={handleOpenAddClientDialog}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No messages yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property details and client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Monthly Rent</Label>
              <Input
                id="edit-price"
                data-testid="input-edit-price"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                placeholder="2500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProperty}
              disabled={updatePropertyMutation.isPending}
              data-testid="button-save-property"
            >
              {updatePropertyMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProperty}
              disabled={deletePropertyMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePropertyMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                "Delete Property"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Client</DialogTitle>
            <DialogDescription>
              Enter the client's details to grant them access to this property. They will log in using their Google account with the email you provide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-clientName">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="add-clientName"
                data-testid="input-add-client-name"
                value={newClientForm.clientName}
                onChange={(e) => setNewClientForm({ ...newClientForm, clientName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-clientEmail">Google Email <span className="text-red-500">*</span></Label>
              <Input
                id="add-clientEmail"
                data-testid="input-add-client-email"
                type="email"
                value={newClientForm.clientEmail}
                onChange={(e) => setNewClientForm({ ...newClientForm, clientEmail: e.target.value })}
                placeholder="client@gmail.com"
              />
              <p className="text-xs text-muted-foreground">Must be a valid Google account email - the client will log in with this</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-clientPhone">Phone Number</Label>
              <Input
                id="add-clientPhone"
                data-testid="input-add-client-phone"
                type="tel"
                value={newClientForm.clientPhone}
                onChange={(e) => setNewClientForm({ ...newClientForm, clientPhone: e.target.value })}
                placeholder="+44 7700 900000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-clientDob">Date of Birth</Label>
              <Input
                id="add-clientDob"
                data-testid="input-add-client-dob"
                type="date"
                value={newClientForm.clientDateOfBirth}
                onChange={(e) => setNewClientForm({ ...newClientForm, clientDateOfBirth: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddClient}
              disabled={addClientMutation.isPending || !newClientForm.clientEmail || !newClientForm.clientName}
              data-testid="button-confirm-add-client"
            >
              {addClientMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
              ) : (
                "Register Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
