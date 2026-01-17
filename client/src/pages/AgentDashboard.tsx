import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, CURRENT_AGENT } from "@/lib/mockData";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MapPin, ChevronRight, AlertCircle, ArrowUpDown, X, AlertTriangle, User, Plus } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { sharedStore } from "@/lib/sharedStore";

export default function AgentDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("me");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showReportsOnly, setShowReportsOnly] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Subscribe to store updates to refresh reports/indicators
  useEffect(() => {
    return sharedStore.subscribe(() => {
      setLastUpdate(Date.now());
    });
  }, []);

  // Calculate report stats
  const allReports = MOCK_PROPERTIES.flatMap(p => sharedStore.getReports(p.id));
  const activeReports = allReports.filter(r => r.status === 'open');
  const urgentReports = activeReports.filter(r => r.priority === 'high');

  // Filtering Logic
  const filteredProperties = MOCK_PROPERTIES.filter(property => {
    // Search
    const query = searchQuery.toLowerCase();
    const clientName = property.client?.name || "";
    const matchesSearch = 
      property.address.toLowerCase().includes(query) ||
      clientName.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.zip.toLowerCase().includes(query) ||
      property.status.toLowerCase().includes(query);

    // Status Filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "awaiting" && property.stage === "Awaiting Documents") ||
      (statusFilter === "review" && property.stage === "In Review") ||
      (statusFilter === "approved" && property.stage === "Approved") ||
      (statusFilter === "empty" && property.stage === "Empty");

    // Agent Filter (Mock logic as data structure assumes single agent for now)
    const matchesAgent = agentFilter === "all" || 
      (agentFilter === "me" && property.agentId === CURRENT_AGENT.id);

    // Report Filter
    const propertyReports = sharedStore.getReports(property.id).filter(r => r.status === 'open');
    const matchesReports = !showReportsOnly || propertyReports.length > 0;

    return matchesSearch && matchesStatus && matchesAgent && matchesReports;
  });

  // Sorting Logic
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // Always put properties with reports at the top if filter is active
    if (showReportsOnly) {
        const reportsA = sharedStore.getReports(a.id).filter(r => r.status === 'open').length;
        const reportsB = sharedStore.getReports(b.id).filter(r => r.status === 'open').length;
        if (reportsA !== reportsB) return reportsB - reportsA;
    }

    if (sortOrder === "newest") return b.id.localeCompare(a.id);
    if (sortOrder === "oldest") return a.id.localeCompare(b.id);
    
    // Calculate progress percentages
    const progressA = a.documents.filter(d => d.status === 'approved').length / a.documents.length;
    const progressB = b.documents.filter(d => d.status === 'approved').length / b.documents.length;
    
    if (sortOrder === "progress_desc") {
      // Highest progress first, then alphabetical by address
      if (progressB !== progressA) return progressB - progressA;
      return a.address.localeCompare(b.address);
    }
    if (sortOrder === "progress_asc") {
      // Lowest progress first, then alphabetical by address
      if (progressA !== progressB) return progressA - progressB;
      return a.address.localeCompare(b.address);
    }
    
    return 0;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAgentFilter("me");
    setSortOrder("newest");
    setShowReportsOnly(false);
  };

  const actionOverview = {
    needsReview: MOCK_PROPERTIES.filter(p => p.stage === "In Review").length,
    stalled: MOCK_PROPERTIES.filter(p => p.stage === "Awaiting Documents").length,
    active: MOCK_PROPERTIES.length
  };

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        
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
          
          {/* Active Reports Alert Banner */}
          {activeReports.length > 0 && (
            <div 
               className={cn(
                 "w-full p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors",
                 showReportsOnly 
                   ? "bg-red-50 border-red-200" 
                   : "bg-white border-border/60 hover:bg-red-50/50 hover:border-red-200/50"
               )}
               onClick={() => setShowReportsOnly(!showReportsOnly)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full",
                  urgentReports.length > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"
                )}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {activeReports.length} Active Issue Report{activeReports.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {urgentReports.length > 0 
                      ? `${urgentReports.length} urgent issues require attention` 
                      : "Click to filter properties with issues"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showReportsOnly ? (
                  <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-100" onClick={(e) => {
                    e.stopPropagation();
                    setShowReportsOnly(false);
                  }}>
                    Clear Filter
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 border-red-200 text-red-700 hover:bg-red-100">
                    View Reports
                  </Button>
                )}
              </div>
            </div>
          )}

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

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-white border-border/60 shadow-sm">
                   <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={CURRENT_AGENT.avatar} />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <SelectValue placeholder="Agent" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
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
                  <SelectItem value="newest">Newest Updated</SelectItem>
                  <SelectItem value="oldest">Oldest Updated</SelectItem>
                  <SelectItem value="progress_desc">Highest Progress</SelectItem>
                  <SelectItem value="progress_asc">Lowest Progress</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {sortedProperties.length > 0 ? (
            sortedProperties.map((property) => {
              const approvedDocs = property.documents.filter(d => d.status === 'approved').length;
              const totalDocs = property.documents.length;
              const progress = (approvedDocs / totalDocs) * 100;

              return (
                <Link key={property.id} href={`/agent/property/${property.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-white border-border/60 overflow-hidden flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={property.image} 
                        alt={property.address}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {/* Report Indicator */}
                        {(() => {
                          const reports = sharedStore.getReports(property.id);
                          const openReports = reports.filter(r => r.status === 'open');
                          if (openReports.length === 0) return null;
                          
                          const hasUrgent = openReports.some(r => r.priority === 'high');
                          
                          return (
                            <div className={cn(
                              "flex items-center justify-center h-6 w-6 rounded-full shadow-sm backdrop-blur-md",
                              hasUrgent ? "bg-red-500 text-white animate-pulse" : "bg-orange-500 text-white"
                            )} title={`${openReports.length} open report(s)`}>
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                          );
                        })()}
                        <StatusBadge status={property.stage} className="shadow-sm backdrop-blur-md bg-white/90" />
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-serif leading-tight">{property.address}</CardTitle>
                          <div className="flex items-center text-muted-foreground text-sm mt-1.5">
                            <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                            {property.city}, {property.zip}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-4 flex-1">
                      {property.client ? (
                        <div className="flex items-center gap-3 mt-2 mb-6 p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                          <Avatar className="h-8 w-8 border border-white shadow-sm">
                            <AvatarImage src={property.client.avatar} />
                            <AvatarFallback>{property.client.name.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm overflow-hidden">
                            <p className="font-medium text-foreground truncate">{property.client.name}</p>
                            <p className="text-muted-foreground text-xs">Client</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2 mb-6 p-2 rounded-lg bg-slate-50/50 border border-slate-100 border-dashed">
                          <div className="h-8 w-8 rounded-full bg-slate-200 border border-white shadow-sm flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="text-sm overflow-hidden">
                            <p className="font-medium text-slate-500 italic">No Client Assigned</p>
                            <p className="text-muted-foreground text-xs">Empty Property</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {property.stage !== 'Empty' ? (
                          <>
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-muted-foreground">Completion Progress</span>
                              <span className={cn(
                                 progress === 100 ? "text-emerald-600" : "text-primary"
                              )}>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                            <div className="flex items-center gap-1.5 mt-2">
                               {property.stage === 'In Review' && (
                                 <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                               )}
                               <p className="text-xs text-muted-foreground">
                                 {approvedDocs} of {totalDocs} documents approved
                               </p>
                            </div>
                          </>
                        ) : (
                          <div className="pt-2">
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-white">
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Assign Client
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 pb-4 border-t border-border/40 mt-auto">
                      <div className="w-full flex items-center justify-between text-primary font-medium text-sm mt-4 group-hover:translate-x-1 transition-transform">
                        <span>Manage Property</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </CardFooter>
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
