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
import { Checkbox } from "@/components/ui/checkbox";
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
  
  // Property Stage State (local override if updated)
  const [currentStage, setCurrentStage] = useState(property?.stage || 'Empty');
  
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [reports, setReports] = useState<ClientReport[]>([]);
  // Store documents locally to support dynamic updates
  const [propertyDocs, setPropertyDocs] = useState<any[]>([]); 
  // Track deleted clients to hide them
  const [deletedClientIds, setDeletedClientIds] = useState<Set<string>>(new Set());
  
  // Report Dialog State
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const [isReportHistoryOpen, setIsReportHistoryOpen] = useState(false);
  
  // Document Review State
  const [selectedReviewDoc, setSelectedReviewDoc] = useState<any | null>(null);

  // Collapsible state
  const [isClient1Open, setIsClient1Open] = useState(true);
  const [isClient2Open, setIsClient2Open] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to reports, docs, and chat
  useEffect(() => {
    if (!property) return;
    setReports(sharedStore.getReports(property.id));
    
    // Initial stage override
    const overrideStage = sharedStore.getPropertyStage(property.id);
    if (overrideStage) setCurrentStage(overrideStage as any);
    else setCurrentStage(property.stage);
    
    // Initial load of documents - combine static mock docs with dynamic store docs
    // In a real app, this would all come from the backend/store
    const dynamicDocs = sharedStore.getPropertyDocuments(property.id);
    const combinedDocs = [...property.documents, ...dynamicDocs];
    setPropertyDocs(combinedDocs);

    // Initial check for unread messages
    const msgs = sharedStore.getMessages(property.id);
    const unread = msgs.filter(m => m.receiverId === CURRENT_AGENT.id && !m.read).length;
    setUnreadCount(unread);

    const unsubscribe = sharedStore.subscribe(() => {
      setReports(sharedStore.getReports(property.id));
      
      const updatedOverrideStage = sharedStore.getPropertyStage(property.id);
      if (updatedOverrideStage) setCurrentStage(updatedOverrideStage as any);
      
      const updatedDynamicDocs = sharedStore.getPropertyDocuments(property.id);
      setPropertyDocs([...property.documents, ...updatedDynamicDocs]);

      // Update unread count
      const updatedMsgs = sharedStore.getMessages(property.id);
      const updatedUnread = updatedMsgs.filter(m => m.receiverId === CURRENT_AGENT.id && !m.read).length;
      setUnreadCount(updatedUnread);
    });
    return unsubscribe;
  }, [property]);

  const handleOpenMessaging = () => {
    setIsMessagingOpen(true);
    if (property) {
      sharedStore.markMessagesAsRead(property.id, CURRENT_AGENT.id);
      setUnreadCount(0);
    }
  };

  if (!property) return <div className="p-8">Property not found</div>;

  const activeReports = reports.filter(r => r.status === 'open');
  const highPriorityReport = activeReports.find(r => r.priority === 'high');

  // Multi-client document splitting logic
  // Group documents by client ID
  const docsByClient: Record<string, any[]> = {};
  
  // Initialize for known clients (if they exist)
  if (property.client) {
    docsByClient[property.client.id] = [];
  }
  
  // Distribute docs
  propertyDocs.forEach(doc => {
    // If doc has a specific clientId, put it there
    if (doc.clientId) {
      if (!docsByClient[doc.clientId]) docsByClient[doc.clientId] = [];
      docsByClient[doc.clientId].push(doc);
    } else if (property.client) {
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
  // Filter out any that have been deleted
  const potentialClientIds = [
    ...(property.client ? [property.client.id] : []),
    ...(property.id === 'p1' ? [secondaryClient.id] : []), // Only add secondary to p1 for demo
    ...Object.keys(docsByClient)
  ];

  const clientIds = new Set(
    potentialClientIds.filter(id => !deletedClientIds.has(id))
  );
  
  // We need to map these IDs to client objects (name, etc.)
  // For dynamic clients added via ClientDetailsCard, we won't have full client objects in MOCK_CLIENTS
  // But ClientDetailsCard manages its own list. 
  // We need to bridge this. Ideally PropertyOverview should read clients from store too.
  // For now, we will rely on the docs having `clientName` which we added in sharedStore.
  
  const displayClientSections = Array.from(clientIds).map(id => {
    // Try to find in MOCK_PROPERTIES or MOCK_CLIENTS
    if (property.client && id === property.client.id) return { id, name: property.client.name, isLead: true };
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
              {activeReports.length > 0 ? (
                <Button 
                  variant="outline" 
                  className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                  onClick={() => setSelectedReport(activeReports[0])}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {activeReports.length} Open Report{activeReports.length > 1 ? 's' : ''}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="bg-white"
                  onClick={() => setIsReportHistoryOpen(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              )}
              
              {property.client ? (
                <Button variant="outline" className="bg-white relative" onClick={handleOpenMessaging}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Client
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="bg-white text-muted-foreground cursor-not-allowed" disabled>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  No Client Assigned
                </Button>
              )}
              
              <Button>Edit Property</Button>
            </div>
            
            {/* Messaging Panel */}
            {property.client && (
              <MessagingPanel 
                isOpen={isMessagingOpen}
                onClose={() => setIsMessagingOpen(false)}
                client={property.client}
                propertyAddress={property.address}
              />
            )}

            {/* Report Detail Dialog */}
            <ReportDetailDialog 
              report={selectedReport} 
              onClose={() => setSelectedReport(null)} 
              clientName={property.client?.name || "Unknown"}
              onOpenChat={() => setIsMessagingOpen(true)}
            />

            {/* Report History Dialog */}
            <ReportHistoryDialog
              isOpen={isReportHistoryOpen}
              onClose={() => setIsReportHistoryOpen(false)}
              reports={reports}
              onSelectReport={(report) => {
                setIsReportHistoryOpen(false);
                setSelectedReport(report);
              }}
            />
            
            {/* Quick Review Modal */}
            <QuickReviewModal 
              doc={selectedReviewDoc} 
              onClose={() => setSelectedReviewDoc(null)} 
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
                <StatusBadge status={currentStage} />
              </CardHeader>
              <CardContent className="space-y-6">
                
                {displayClientSections.length > 0 ? (
                  displayClientSections.map((client, index) => {
                    // Only show if there are documents or it's a main client
                    const docs = docsByClient[client.id] || [];
                    if (docs.length === 0 && !client.isLead && client.id !== secondaryClient.id) return null;

                    return (
                      <div key={client.id}>
                         <ClientDocSection 
                           client={client} 
                           docs={docs} 
                           defaultOpen={false}
                           onSelectDoc={setSelectedReviewDoc}
                         />
                         {index < displayClientSections.length - 1 && <Separator className="my-0" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-dashed border-border/60">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No Clients Assigned</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                      This property is currently empty. Add a client to start tracking documents and managing the tenancy.
                    </p>
                    {/* The Add Client button is in the sidebar card, so we can point there or duplicate the trigger if we refactor ClientDetailsCard to expose it */}
                  </div>
                )}

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
          <div className="flex flex-col gap-6 h-full">
            
            {/* Client Details Card Component */}
            <ClientDetailsCard 
              initialClients={[
                ...(property.client ? [property.client] : []),
                ...(property.id === 'p1' ? [secondaryClient] : [])
              ]} 
              propertyId={property.id}
              onDeleteClient={(id) => {
                setDeletedClientIds(prev => {
                  const newSet = new Set(prev);
                  newSet.add(id);
                  return newSet;
                });
              }}
            />

            {/* Rent Schedule Card Component */}
            <div className="flex-1">
              <RentScheduleCard />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ClientDocSection({ client, docs, defaultOpen, onSelectDoc }: { client: any, docs: any[], defaultOpen: boolean, onSelectDoc: (doc: any) => void }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
       <div 
         className="flex items-center justify-between mb-3 bg-slate-50 p-2 rounded-md cursor-pointer hover:bg-slate-100 transition-colors"
         onClick={() => setIsOpen(!isOpen)}
       >
         <div className="flex items-center gap-2">
           <Users className="h-4 w-4 text-primary" />
           <span className="font-medium text-sm">{client.name}</span>
           {client.isLead && <Badge variant="outline" className="text-[10px] h-5">Lead Tenant</Badge>}
         </div>
         <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
           {isOpen ? (
             <ChevronDown className="h-4 w-4" />
           ) : (
             <ChevronRight className="h-4 w-4" />
           )}
         </Button>
       </div>
       <CollapsibleContent className="space-y-1 animate-in slide-in-from-top-2">
         {docs.length > 0 ? (
           docs.map((doc) => (
             <DocumentRow key={doc.id} doc={doc} onClick={() => onSelectDoc(doc)} />
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

function DocumentRow({ doc, onClick }: { doc: any, onClick: () => void }) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    // In a real app, this would trigger a file download from the server/blob storage
    // For the mockup, we'll simulate the download action
    toast({
      title: "Downloading Document",
      description: `Starting download for ${doc.name}...`,
    });
    
    // Simulate a small delay then success
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: `${doc.name} has been successfully downloaded.`,
      });
    }, 1500);
  };

  return (
    <div 
      className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-border/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded text-slate-600 mt-1">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.type}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-end">
        <StatusBadge status={doc.status} />
        
        <div className="flex items-center max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out opacity-0 group-hover:opacity-100">
           {doc.status !== 'pending' && (
             <div className="flex items-center gap-1 pl-3">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors" 
                 title="Download"
                 onClick={handleDownload}
               >
                 <Download className="h-4 w-4" />
               </Button>
             </div>
           )}
           {doc.status === 'in_review' && (
             <div className="flex items-center gap-1 pl-3">
               <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Approve" onClick={(e) => { e.stopPropagation(); /* TODO: Implement */ }}>
                 <CheckCircle className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Request Changes" onClick={(e) => { e.stopPropagation(); /* TODO: Implement */ }}>
                 <XCircle className="h-4 w-4" />
               </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function QuickReviewModal({ doc, onClose }: { doc: any | null, onClose: () => void }) {
  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="grid grid-cols-3 h-full">
          {/* Left Side: Document Preview */}
          <div className="col-span-2 bg-slate-100 border-r border-border/50 flex flex-col relative">
             <div className="absolute top-4 left-4 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
               Preview Mode
             </div>
             
             {/* Mock PDF Viewer / Image Preview */}
             <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
                <div className="bg-white shadow-lg w-full max-w-[600px] min-h-[800px] p-12 relative group">
                   {/* Document Skeleton Content */}
                   <div className="space-y-6 opacity-40 select-none pointer-events-none">
                      <div className="h-8 w-1/3 bg-slate-200 rounded" />
                      <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-4 w-5/6 bg-slate-200 rounded" />
                        <div className="h-4 w-4/6 bg-slate-200 rounded" />
                      </div>
                      <div className="h-64 w-full bg-slate-100 rounded border-2 border-dashed border-slate-200 flex items-center justify-center">
                         <FileText className="h-16 w-16 text-slate-300" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-4 w-2/3 bg-slate-200 rounded" />
                      </div>
                   </div>
                   
                   {/* Overlay Text */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                         <p className="text-slate-400 font-medium mb-2">Document Preview</p>
                         <p className="text-2xl font-serif font-bold text-slate-800">{doc.name}</p>
                         <p className="text-sm text-slate-500 mt-1">Uploaded on {doc.uploadDate || 'Recently'}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Side: Review Checklist */}
          <div className="col-span-1 bg-white flex flex-col h-full">
             <div className="p-6 border-b">
                <h2 className="text-xl font-serif font-bold mb-1">Review Document</h2>
                <p className="text-sm text-muted-foreground">Verify the details below to approve.</p>
             </div>
             
             <div className="flex-1 overflow-auto p-6 space-y-6">
                <div className="space-y-4">
                   <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Checklist</h3>
                   
                   <div className="space-y-3">
                      <div className="flex items-start gap-3">
                         <Checkbox id="check1" />
                         <label htmlFor="check1" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">
                            Document matches the requested type ({doc.type})
                         </label>
                      </div>
                      <div className="flex items-start gap-3">
                         <Checkbox id="check2" />
                         <label htmlFor="check2" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">
                            Information is legible and clear
                         </label>
                      </div>
                      <div className="flex items-start gap-3">
                         <Checkbox id="check3" />
                         <label htmlFor="check3" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5">
                            Valid dates and signatures are present
                         </label>
                      </div>
                   </div>
                </div>

                <Separator />

                <div className="space-y-4">
                   <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Status</h3>
                   <div className="p-4 bg-slate-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-medium text-slate-700">Current Status</span>
                         <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                         Last updated: {doc.uploadDate || 'Pending'}
                      </p>
                   </div>
                </div>
             </div>

             <div className="p-6 border-t bg-slate-50/50 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                   <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={onClose}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                   </Button>
                   <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={onClose}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportHistoryDialog({ 
  isOpen, 
  onClose, 
  reports, 
  onSelectReport 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  reports: ClientReport[],
  onSelectReport: (report: ClientReport) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Report History</DialogTitle>
          <DialogDescription>
            History of all issues reported for this property.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4 -mr-4">
          <div className="space-y-3 py-2">
            {reports.length > 0 ? (
              reports
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((report) => (
                <div 
                  key={report.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onSelectReport(report)}
                >
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    report.status === 'resolved' ? "bg-green-100 text-green-600" : 
                    report.status === 'ignored' ? "bg-slate-100 text-slate-500" :
                    report.priority === 'high' ? "bg-red-100 text-red-600" :
                    "bg-orange-100 text-orange-600"
                  )}>
                    {report.status === 'resolved' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {report.description}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(report.createdAt), "d MMM yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 h-5 capitalize">
                        {report.category}
                      </Badge>
                      <Badge 
                        variant={
                          report.status === 'resolved' ? 'outline' : 
                          report.priority === 'high' ? 'destructive' : 'secondary'
                        } 
                        className={cn(
                          "text-[10px] px-1.5 h-5",
                          report.status === 'resolved' && "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        {report.status === 'open' ? `${report.priority} Priority` : report.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No reports found for this property.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
