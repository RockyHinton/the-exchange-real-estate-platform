import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS, CURRENT_AGENT } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  ArrowLeft, 
  MapPin, 
  MessageSquare, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  FileText,
  History,
  Mail,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronRight,
  Send,
  User,
  Clock,
  Check
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { Separator } from "@/components/ui/separator";
import { ClientDetailsCard } from "@/components/ClientDetailsCard";
import { RentScheduleCard } from "@/components/RentScheduleCard";
import { MessagingPanel } from "@/components/MessagingPanel";
import { sharedStore, ClientReport, ReportMessage } from "@/lib/sharedStore";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function PropertyOverview() {
  const [, params] = useRoute("/agent/property/:id");
  const property = MOCK_PROPERTIES.find(p => p.id === params?.id);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [reports, setReports] = useState<ClientReport[]>([]);
  // Store documents locally to support dynamic updates
  const [propertyDocs, setPropertyDocs] = useState<any[]>([]); 
  
  // Report Dialog State
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);

  // Collapsible state
  const [isClient1Open, setIsClient1Open] = useState(true);
  const [isClient2Open, setIsClient2Open] = useState(false);

  // Subscribe to reports and docs
  useEffect(() => {
    if (!property) return;
    setReports(sharedStore.getReports(property.id));
    
    // Initial load of documents - combine static mock docs with dynamic store docs
    // In a real app, this would all come from the backend/store
    const dynamicDocs = sharedStore.getPropertyDocuments(property.id);
    const combinedDocs = [...property.documents, ...dynamicDocs];
    setPropertyDocs(combinedDocs);

    const unsubscribe = sharedStore.subscribe(() => {
      setReports(sharedStore.getReports(property.id));
      
      const updatedDynamicDocs = sharedStore.getPropertyDocuments(property.id);
      setPropertyDocs([...property.documents, ...updatedDynamicDocs]);
    });
    return unsubscribe;
  }, [property]);

  if (!property) return <div className="p-8">Property not found</div>;

  const activeReports = reports.filter(r => r.status === 'open');
  const highPriorityReport = activeReports.find(r => r.priority === 'high');

  // Multi-client document splitting logic
  // Group documents by client ID
  const docsByClient: Record<string, any[]> = {};
  
  // Initialize for known clients
  docsByClient[property.client.id] = [];
  
  // Distribute docs
  propertyDocs.forEach(doc => {
    // If doc has a specific clientId, put it there
    if (doc.clientId) {
      if (!docsByClient[doc.clientId]) docsByClient[doc.clientId] = [];
      docsByClient[doc.clientId].push(doc);
    } else {
      // Fallback for mock data (distribute somewhat evenly or to lead)
      // For this mock, we'll put the original mock docs (which don't have clientId) 
      // into the lead tenant's bucket mostly
      docsByClient[property.client.id].push(doc);
    }
  });

  // Mock secondary client for demonstration (only if not in docsByClient)
  const secondaryClient = MOCK_CLIENTS[1]; 
  
  // Get all unique client IDs from docs to ensure we show sections for them
  // plus the property client and secondary client
  const clientIds = new Set([property.client.id, secondaryClient.id, ...Object.keys(docsByClient)]);
  
  // We need to map these IDs to client objects (name, etc.)
  // For dynamic clients added via ClientDetailsCard, we won't have full client objects in MOCK_CLIENTS
  // But ClientDetailsCard manages its own list. 
  // We need to bridge this. Ideally PropertyOverview should read clients from store too.
  // For now, we will rely on the docs having `clientName` which we added in sharedStore.
  
  const displayClientSections = Array.from(clientIds).map(id => {
    // Try to find in MOCK_PROPERTIES or MOCK_CLIENTS
    if (id === property.client.id) return { id, name: property.client.name, isLead: true };
    if (id === secondaryClient.id) return { id, name: secondaryClient.name, isLead: false };
    
    // Check if any doc has this clientId and a clientName
    const docWithInfo = docsByClient[id]?.find(d => d.clientName);
    if (docWithInfo) return { id, name: docWithInfo.clientName, isLead: false };
    
    return { id, name: "Unknown Client", isLead: false };
  });

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/agent">
            <Button variant="ghost" className="pl-0 hover:bg-transparent text-muted-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          {highPriorityReport && (
             <div 
               className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 cursor-pointer hover:bg-red-50/80 transition-colors"
               onClick={() => setSelectedReport(highPriorityReport)}
             >
               <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
               <div className="flex-1">
                 <h3 className="font-medium text-red-900">Urgent Issue Reported</h3>
                 <p className="text-sm text-red-700 mt-1">{highPriorityReport.description}</p>
                 <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100" onClick={(e) => {
                      e.stopPropagation();
                      sharedStore.resolveReport(property.id, highPriorityReport.id);
                    }}>
                      Mark Resolved
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-700 hover:bg-red-100 hover:text-red-800">
                      View Details
                    </Button>
                 </div>
               </div>
             </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">{property.address}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 mr-1.5" />
                {property.city}, {property.zip}
                <Separator orientation="vertical" className="mx-3 h-4" />
                <span className="font-medium text-foreground">{property.price}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {activeReports.length > 0 && !highPriorityReport && (
                <Button 
                  variant="outline" 
                  className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                  onClick={() => setSelectedReport(activeReports[0])}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {activeReports.length} Open Report{activeReports.length > 1 ? 's' : ''}
                </Button>
              )}
              <Button variant="outline" className="bg-white" onClick={() => setIsMessagingOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Client
              </Button>
              <Button>Edit Property</Button>
            </div>
            
            {/* Messaging Panel */}
            <MessagingPanel 
              isOpen={isMessagingOpen}
              onClose={() => setIsMessagingOpen(false)}
              client={property.client}
              propertyAddress={property.address}
            />

            {/* Report Detail Dialog */}
            <ReportDetailDialog 
              report={selectedReport} 
              onClose={() => setSelectedReport(null)} 
              clientName={property.client.name}
              onOpenChat={() => setIsMessagingOpen(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Split Document Checklist */}
            <Card className="bg-white border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-serif">Document Checklist</CardTitle>
                  <CardDescription>Review documents by client</CardDescription>
                </div>
                <StatusBadge status={property.stage} />
              </CardHeader>
              <CardContent className="space-y-6">
                
                {displayClientSections.map((client, index) => {
                  // Only show if there are documents or it's a main client
                  const docs = docsByClient[client.id] || [];
                  if (docs.length === 0 && !client.isLead && client.id !== secondaryClient.id) return null;

                  return (
                    <div key={client.id}>
                       <ClientDocSection 
                         client={client} 
                         docs={docs} 
                         defaultOpen={index === 0}
                       />
                       {index < displayClientSections.length - 1 && <Separator className="my-0" />}
                    </div>
                  );
                })}

              </CardContent>
            </Card>

            {/* Activity Timeline (Mocked) */}
            <Card className="bg-white border-border/60 shadow-sm">
               <CardHeader>
                  <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="relative border-l border-border/60 ml-3 space-y-6 pb-2">
                     <div className="ml-6 relative">
                        <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white" />
                        <p className="text-sm font-medium text-foreground">Proof of Address uploaded</p>
                        <p className="text-xs text-muted-foreground mt-0.5">By Client • 2 hours ago</p>
                     </div>
                     <div className="ml-6 relative">
                        <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary/20 ring-4 ring-white" />
                        <p className="text-sm font-medium text-foreground">Proof of ID approved</p>
                        <p className="text-xs text-muted-foreground mt-0.5">By James Sterling • Yesterday</p>
                     </div>
                     <div className="ml-6 relative">
                        <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary/20 ring-4 ring-white" />
                        <p className="text-sm font-medium text-foreground">Property stage updated to "In Review"</p>
                        <p className="text-xs text-muted-foreground mt-0.5">System • 2 days ago</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Client Details Card Component */}
            <ClientDetailsCard 
              initialClients={[property.client, secondaryClient]} 
              propertyId={property.id}
            />

            {/* Rent Schedule Card Component */}
            <RentScheduleCard />

            {/* Quick Actions */}
            <Card className="bg-primary text-primary-foreground border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start text-primary">
                  <Mail className="h-4 w-4 mr-2" /> Send Reminder
                </Button>
                <Button variant="ghost" className="w-full justify-start hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <History className="h-4 w-4 mr-2" /> View Audit Log
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ClientDocSection({ client, docs, defaultOpen }: { client: any, docs: any[], defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
       <div className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-md">
         <div className="flex items-center gap-2">
           <Users className="h-4 w-4 text-primary" />
           <span className="font-medium text-sm">{client.name}</span>
           {client.isLead && <Badge variant="outline" className="text-[10px] h-5">Lead Tenant</Badge>}
         </div>
         <CollapsibleTrigger asChild>
           <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
             {isOpen ? (
               <ChevronDown className="h-4 w-4" />
             ) : (
               <ChevronRight className="h-4 w-4" />
             )}
           </Button>
         </CollapsibleTrigger>
       </div>
       <CollapsibleContent className="space-y-1 animate-in slide-in-from-top-2">
         {docs.length > 0 ? (
           docs.map((doc) => (
             <DocumentRow key={doc.id} doc={doc} />
           ))
         ) : (
           <p className="text-xs text-muted-foreground pl-2 py-2">No documents assigned.</p>
         )}
       </CollapsibleContent>
    </Collapsible>
  );
}

// Helper Component for Report Details
function ReportDetailDialog({ report, onClose, clientName, onOpenChat }: { 
  report: ClientReport | null, 
  onClose: () => void, 
  clientName: string,
  onOpenChat: () => void 
}) {
  if (!report) return null;

  const handleResolve = () => {
    sharedStore.resolveReport(report.propertyId, report.id, 'resolved');
    toast({ title: "Report Resolved", description: "The issue has been marked as resolved." });
    onClose();
  };

  const handleChat = () => {
    onClose();
    onOpenChat();
  };

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="p-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={report.priority === 'high' ? 'destructive' : report.priority === 'medium' ? 'default' : 'secondary'}>
                {report.priority.toUpperCase()} PRIORITY
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">• {report.category} Issue</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(report.createdAt), "d MMM, HH:mm")}
            </span>
          </div>
          <DialogTitle className="text-xl mt-2">Report from {clientName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
           <div className="p-4 bg-slate-50 rounded-lg border text-foreground">
             "{report.description}"
           </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          <Button variant="outline" onClick={handleChat} className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuss in Chat
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={handleResolve}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentRow({ doc }: { doc: any }) {
  return (
    <div className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-border/50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded text-slate-600 mt-1">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.type}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <StatusBadge status={doc.status} />
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {doc.status !== 'pending' && (
             <>
               <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                 <Eye className="h-4 w-4 text-slate-600" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8" title="Download">
                 <Download className="h-4 w-4 text-slate-600" />
               </Button>
             </>
           )}
           {doc.status === 'in_review' && (
             <>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Approve">
                 <CheckCircle className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Request Changes">
                 <XCircle className="h-4 w-4" />
               </Button>
             </>
           )}
        </div>
      </div>
    </div>
  );
}
