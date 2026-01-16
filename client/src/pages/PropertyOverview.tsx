import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS } from "@/lib/mockData";
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
  Users
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { Separator } from "@/components/ui/separator";
import { ClientDetailsCard } from "@/components/ClientDetailsCard";
import { RentScheduleCard } from "@/components/RentScheduleCard";
import { MessagingPanel } from "@/components/MessagingPanel";
import { sharedStore, ClientReport } from "@/lib/sharedStore";
import { Badge } from "@/components/ui/badge";

export default function PropertyOverview() {
  const [, params] = useRoute("/agent/property/:id");
  const property = MOCK_PROPERTIES.find(p => p.id === params?.id);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [reports, setReports] = useState<ClientReport[]>([]);

  // Subscribe to reports
  useEffect(() => {
    if (!property) return;
    setReports(sharedStore.getReports(property.id));
    
    const unsubscribe = sharedStore.subscribe(() => {
      setReports(sharedStore.getReports(property.id));
    });
    return unsubscribe;
  }, [property]);

  if (!property) return <div className="p-8">Property not found</div>;

  const activeReports = reports.filter(r => r.status === 'open');
  const highPriorityReport = activeReports.find(r => r.priority === 'high');

  // Multi-client document splitting logic (Mock for now, assigning docs to clients randomly/evenly)
  // In a real app, documents would belong to specific clients in the data model.
  const clientDocs = {
    [property.client.id]: property.documents.slice(0, 3), // First 3 docs to Client 1
    "c2": property.documents.slice(3) // Rest to "Client 2" (mock)
  };

  // Mock secondary client for demonstration
  const secondaryClient = MOCK_CLIENTS[1]; 
  const displayClients = [property.client, secondaryClient];

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
             <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
               <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
               <div className="flex-1">
                 <h3 className="font-medium text-red-900">Urgent Issue Reported</h3>
                 <p className="text-sm text-red-700 mt-1">{highPriorityReport.description}</p>
                 <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100" onClick={() => sharedStore.resolveReport(property.id, highPriorityReport.id)}>
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
                
                {/* Client 1 Section */}
                <div>
                   <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-md">
                     <Users className="h-4 w-4 text-primary" />
                     <span className="font-medium text-sm">{property.client.name}</span>
                     <Badge variant="outline" className="text-[10px] h-5">Lead Tenant</Badge>
                   </div>
                   <div className="space-y-1">
                     {clientDocs[property.client.id]?.map((doc) => (
                       <DocumentRow key={doc.id} doc={doc} />
                     ))}
                   </div>
                </div>

                <Separator />

                {/* Client 2 Section (Mock) */}
                <div>
                   <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-md">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <span className="font-medium text-sm text-muted-foreground">{secondaryClient.name}</span>
                   </div>
                   <div className="space-y-1">
                     {clientDocs["c2"]?.map((doc) => (
                       <DocumentRow key={doc.id} doc={doc} />
                     ))}
                   </div>
                </div>

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
            <ClientDetailsCard initialClients={displayClients} />

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
