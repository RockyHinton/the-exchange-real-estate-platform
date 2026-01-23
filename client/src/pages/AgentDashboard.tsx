import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MapPin, ChevronRight, AlertCircle, ArrowUpDown, X, AlertTriangle, User, Plus, Loader2, Check, Clock } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useProperties, useCreateProperty, PropertyWithClient } from "@/hooks/use-properties";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { data: properties = [], isLoading } = useProperties();
  const createPropertyMutation = useCreateProperty();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("me");
  const [sortOrder, setSortOrder] = useState("newest");
  
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    address: "",
    city: "",
    postcode: "",
    price: "",
    imageUrl: "",
    clientEmail: "",
    clientName: ""
  });

  const handleAddProperty = async () => {
    if (!newProperty.address || !newProperty.city || !newProperty.postcode || !newProperty.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all property details.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPropertyMutation.mutateAsync({
        address: newProperty.address,
        city: newProperty.city,
        postcode: newProperty.postcode,
        price: newProperty.price,
        imageUrl: newProperty.imageUrl || undefined,
        clientEmail: newProperty.clientEmail || undefined,
        clientName: newProperty.clientName || undefined,
      });
      
      setIsAddPropertyOpen(false);
      setNewProperty({ address: "", city: "", postcode: "", price: "", imageUrl: "", clientEmail: "", clientName: "" });
      toast({
        title: "Property Added",
        description: `${newProperty.address} has been added to your portfolio.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive"
      });
    }
  };

  const userName = user?.firstName || user?.email?.split("@")[0] || "Agent";

  const getStageFromLifecycle = (status: string): string => {
    switch (status) {
      case "onboarding_in_progress": return "Awaiting Documents";
      case "onboarding_ready_to_confirm": return "In Review";
      case "approved_active_tenancy": return "Approved";
      default: return "Empty";
    }
  };

  const filteredProperties = properties.filter(property => {
    const effectiveStage = property.clientId ? getStageFromLifecycle(property.lifecycleStatus) : "Empty";

    const query = searchQuery.toLowerCase();
    const clientName = property.client?.firstName && property.client?.lastName 
      ? `${property.client.firstName} ${property.client.lastName}`
      : property.clientName || "";
    const matchesSearch = 
      property.address.toLowerCase().includes(query) ||
      clientName.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.postcode.toLowerCase().includes(query) ||
      effectiveStage.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "awaiting" && effectiveStage === "Awaiting Documents") ||
      (statusFilter === "review" && effectiveStage === "In Review") ||
      (statusFilter === "approved" && effectiveStage === "Approved") ||
      (statusFilter === "empty" && effectiveStage === "Empty");
    
    return matchesSearch && matchesStatus;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOrder === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return a.address.localeCompare(b.address);
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAgentFilter("me");
    setSortOrder("newest");
  };

  const actionOverview = {
    needsReview: properties.filter(p => 
      p.clientId && p.lifecycleStatus === "onboarding_ready_to_confirm"
    ).length,
    stalled: properties.filter(p => 
      p.clientId && p.lifecycleStatus === "onboarding_in_progress"
    ).length,
    active: properties.length
  };

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {userName}</p>
            </div>
            <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Add a new property to your portfolio. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      data-testid="input-address"
                      value={newProperty.address}
                      onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                        id="city"
                        data-testid="input-city"
                        value={newProperty.city}
                        onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                        placeholder="London"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                        id="postcode"
                        data-testid="input-postcode"
                        value={newProperty.postcode}
                        onChange={(e) => setNewProperty({ ...newProperty, postcode: e.target.value })}
                        placeholder="SW1A 1AA"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Rent</Label>
                    <Input
                      id="price"
                      data-testid="input-price"
                      value={newProperty.price}
                      onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                      placeholder="2500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email (Optional)</Label>
                    <Input
                      id="clientEmail"
                      data-testid="input-client-email"
                      type="email"
                      value={newProperty.clientEmail}
                      onChange={(e) => setNewProperty({ ...newProperty, clientEmail: e.target.value })}
                      placeholder="client@example.com"
                    />
                    <p className="text-[0.8rem] text-muted-foreground">Pre-register client email for access</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name (Optional)</Label>
                    <Input
                      id="clientName"
                      data-testid="input-client-name"
                      value={newProperty.clientName}
                      onChange={(e) => setNewProperty({ ...newProperty, clientName: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Property Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      data-testid="input-image-url"
                      value={newProperty.imageUrl}
                      onChange={(e) => setNewProperty({ ...newProperty, imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPropertyOpen(false)}>Cancel</Button>
                  <Button 
                    type="submit" 
                    onClick={handleAddProperty}
                    disabled={createPropertyMutation.isPending}
                    data-testid="button-add-property-submit"
                  >
                    {createPropertyMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                    ) : (
                      "Add Property"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        {/* Action Overview Card */}
        <Card className="bg-white border-border/60 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border/40">
               <div className="flex items-center gap-2 mb-2">
                 <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                 <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Primary Attention</span>
               </div>
               <div className="flex items-baseline gap-3">
                 <h2 className="text-4xl font-serif font-bold text-foreground">{actionOverview.needsReview}</h2>
                 <p className="text-lg text-muted-foreground">Documents awaiting approval</p>
               </div>
               <div className="mt-4">
                 <Button 
                   variant="link" 
                   className="p-0 h-auto text-primary hover:text-primary/80 font-medium text-sm"
                   onClick={() => setStatusFilter("review")}
                 >
                   View pending documents &rarr;
                 </Button>
               </div>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row">
              <div className="p-6 flex-1 border-b sm:border-b-0 sm:border-r border-border/40 bg-slate-50/50">
                 <p className="text-sm font-medium text-muted-foreground mb-1">Overdue / Stalled</p>
                 <h3 className="text-2xl font-serif font-bold text-foreground">{actionOverview.stalled}</h3>
                 <p className="text-xs text-muted-foreground mt-1">Properties waiting on client</p>
              </div>
              <div className="p-6 flex-1 bg-slate-50/50">
                 <p className="text-sm font-medium text-muted-foreground mb-1">Active Properties</p>
                 <h3 className="text-2xl font-serif font-bold text-foreground">{actionOverview.active}</h3>
                 <p className="text-xs text-muted-foreground mt-1">Total portfolio</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Toolbar */}
        <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 pt-2 pb-4 -mx-2 px-2 md:-mx-4 md:px-4 border-b border-border/5 mb-6 space-y-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            {/* Search */}
            <div className="relative w-full xl:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by address, client name, or location..." 
                className="pl-10 h-11 bg-white border-border/60 shadow-sm focus-visible:ring-primary/20" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-white border-border/60 shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="awaiting">Awaiting Documents</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="empty">Empty</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[160px] h-10 bg-white border-border/60 shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Sort" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">A-Z by Address</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || statusFilter !== 'all' || agentFilter !== 'me') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground h-10 px-3"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Showing {sortedProperties.length} properties</span>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProperties.length > 0 ? (
            sortedProperties.map((property) => {
              const effectiveStage = property.clientId 
                ? getStageFromLifecycle(property.lifecycleStatus) 
                : "Empty";
              
              const defaultImage = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

              const getStatusBadge = () => {
                switch (effectiveStage) {
                  case "Approved":
                    return (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-100">
                        <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-700">Approved</span>
                      </div>
                    );
                  case "In Review":
                    return (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 border border-orange-100">
                        <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-medium text-orange-700">In Review</span>
                      </div>
                    );
                  case "Awaiting Documents":
                    return (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 border border-blue-100">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-blue-700">Awaiting Documents</span>
                      </div>
                    );
                  default:
                    return (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-100">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">Empty</span>
                      </div>
                    );
                }
              };

              return (
                <Link key={property.id} href={`/agent/property/${property.id}`}>
                  <Card 
                    className="group cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-white border-border/60 overflow-hidden flex flex-col"
                    data-testid={`card-property-${property.id}`}
                  >
                    <div className="relative h-40 overflow-hidden bg-slate-100">
                      <img 
                        src={property.imageUrl || defaultImage} 
                        alt={property.address}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-serif font-medium leading-tight line-clamp-1">{property.address}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                        {property.city}, {property.postcode}
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        {getStatusBadge()}
                      </div>
                      
                      <div className="flex items-center justify-between text-primary font-medium text-sm mt-4 pt-3 border-t border-border/40 group-hover:translate-x-1 transition-transform">
                        <span>Manage Property</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-lg border border-dashed border-border">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No properties found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="mt-4"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
