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
  Mail,
  Phone,
  Loader2,
  Edit,
  Trash2,
  CheckCircle
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
import { useProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/use-properties";
import { useAuth } from "@/hooks/use-auth";

export default function PropertyOverview() {
  const [, params] = useRoute("/agent/property/:id");
  const [, setLocation] = useLocation();
  const { data: property, isLoading, error } = useProperty(params?.id);
  const { user } = useAuth();
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    clientEmail: "",
    clientName: "",
    price: "",
  });

  const getStageFromLifecycle = (status: string): string => {
    switch (status) {
      case "onboarding_in_progress": return "Awaiting Documents";
      case "onboarding_ready_to_confirm": return "In Review";
      case "approved_active_tenancy": return "Approved";
      default: return "Empty";
    }
  };

  const currentStage = property?.clientId 
    ? getStageFromLifecycle(property.lifecycleStatus) 
    : (property?.clientEmail ? "Awaiting Documents" : "Empty");

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

  const clientName = property.client?.firstName && property.client?.lastName
    ? `${property.client.firstName} ${property.client.lastName}`
    : property.clientName || null;

  const clientEmail = property.client?.email || property.clientEmail || null;
  const clientPhone = property.client?.phone || null;
  const clientInitials = clientName?.substring(0, 2).toUpperCase() || "??";
  const defaultImage = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

  const handleOpenEditDialog = () => {
    setEditForm({
      clientEmail: property.clientEmail || "",
      clientName: property.clientName || "",
      price: property.price || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProperty = async () => {
    try {
      await updatePropertyMutation.mutateAsync({
        id: property.id,
        data: {
          clientEmail: editForm.clientEmail || undefined,
          clientName: editForm.clientName || undefined,
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
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientName || clientEmail ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={property.client?.profileImageUrl || undefined} />
                        <AvatarFallback>{clientInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{clientName || "Client"}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.clientId ? "Registered" : "Pending Registration"}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    {clientEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{clientEmail}</span>
                      </div>
                    )}
                    {clientPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{clientPhone}</span>
                      </div>
                    )}
                    {!property.clientId && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        Client has been pre-registered but hasn't logged in yet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground mb-3">No client assigned</p>
                    <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
                      Assign Client
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
            <div className="space-y-2">
              <Label htmlFor="edit-clientEmail">Client Email</Label>
              <Input
                id="edit-clientEmail"
                data-testid="input-edit-client-email"
                type="email"
                value={editForm.clientEmail}
                onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                placeholder="client@example.com"
              />
              <p className="text-xs text-muted-foreground">Pre-register the client's email for access</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-clientName">Client Name</Label>
              <Input
                id="edit-clientName"
                data-testid="input-edit-client-name"
                value={editForm.clientName}
                onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                placeholder="John Smith"
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
    </Layout>
  );
}
