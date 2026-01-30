/**
 * AGENT PROPERTY WORKFLOW VIEW
 * This page is workflow-first. Do not add hero imagery or convert to a generic property overview.
 * The main content area MUST be a Document Checklist workflow per client.
 */
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { MessagingPanel } from "@/components/MessagingPanel";
import { RentScheduleCard } from "@/components/RentScheduleCard";
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
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Eye,
  Check,
  RotateCcw,
  AlertTriangle,
  Send,
  Calendar,
  PoundSterling,
  ClipboardList,
  Bell,
  Download,
  Package
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WelcomePackEditor } from "@/components/WelcomePackEditor";
import { Link, useRoute, useLocation } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
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
import { usePropertyDocuments, useUpdateDocumentStatus, usePropertyReports, useUpdateReportStatus, useCreateChecklistSnapshot, useClientChecklist, useUpdateClientChecklistRequirement, type ReportWithMessages, type ClientChecklistData } from "@/hooks/use-client-data";
import { useAuth } from "@/hooks/use-auth";
import type { Document, ClientChecklistRequirement } from "@shared/schema";
import { FIXED_STAGES } from "@shared/schema";

const REQUIRED_DOCUMENTS = [
  { type: "id", name: "Government ID", description: "Passport or driving license" },
  { type: "proof_of_address", name: "Proof of Address", description: "Utility bill or bank statement (last 3 months)" },
  { type: "proof_of_income", name: "Proof of Income", description: "Recent payslips or employment letter" },
  { type: "bank_statements", name: "Bank Statements", description: "Last 3 months of statements" },
  { type: "references", name: "References", description: "Previous landlord or employer reference" },
  { type: "right_to_rent", name: "Right to Rent", description: "Visa or residency documentation" },
];

interface ClientChecklistSectionProps {
  client: PropertyClientWithUser;
  propertyId: string;
  documents: Document[];
  isExpanded: boolean;
  onToggle: () => void;
  onPreview: (doc: Document) => void;
  onApprove: (doc: Document) => void;
  onReject: (doc: Document) => void;
  onApproveRequirement: (req: ClientChecklistRequirement) => void;
  onRejectRequirement: (req: ClientChecklistRequirement) => void;
  onMessage: () => void;
}

function ClientChecklistSection({
  client,
  propertyId,
  documents,
  isExpanded,
  onToggle,
  onPreview,
  onApprove,
  onReject,
  onApproveRequirement,
  onRejectRequirement,
  onMessage,
}: ClientChecklistSectionProps) {
  // Fetch the client's checklist snapshot using propertyClient.id
  const { data: checklistData } = useClientChecklist(propertyId, client.id);
  
  const clientDocs = documents.filter(d => d.userId === client.userId);
  const uploadedCount = clientDocs.length;
  
  // Use checklist snapshot requirements if available, otherwise fall back to REQUIRED_DOCUMENTS
  const requirements = checklistData?.requirements || [];
  const hasChecklistSnapshot = requirements.length > 0;
  
  // Count approved requirements from checklist snapshot, not from documents table
  const requiredReqs = hasChecklistSnapshot ? requirements.filter(r => r.required) : [];
  const approvedCount = hasChecklistSnapshot 
    ? requiredReqs.filter(r => r.status === "approved").length 
    : clientDocs.filter(d => d.status === "approved").length;
  const totalRequired = hasChecklistSnapshot ? requiredReqs.length : REQUIRED_DOCUMENTS.length;

  const getDocStatus = (docType: string) => {
    const doc = clientDocs.find(d => d.type === docType);
    if (!doc) return { status: "missing", doc: null };
    return { status: doc.status, doc };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700";
      case "in_review": return "bg-blue-100 text-blue-700";
      case "uploaded": return "bg-amber-100 text-amber-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Approved";
      case "in_review": return "In Review";
      case "uploaded": return "Uploaded";
      case "rejected": return "Rejected";
      default: return "Missing";
    }
  };

  const clientName = client.clientName || client.user?.firstName || client.clientEmail;
  const initials = clientName.substring(0, 2).toUpperCase();

  return (
    <div className="border rounded-lg bg-white" data-testid={`client-checklist-${client.id}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        data-testid={`button-toggle-client-${client.id}`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={client.user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium text-sm">{clientName}</p>
            <p className="text-xs text-muted-foreground">{client.clientEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {approvedCount}/{totalRequired} complete
          </span>
          {!client.userId && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Pending Login
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t px-4 pb-4">
          <div className="flex items-center justify-between py-3 border-b mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Document Requirements</span>
            {client.userId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onMessage}
                data-testid={`button-message-client-${client.id}`}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Message
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {hasChecklistSnapshot ? (
              // Use checklist snapshot requirements grouped by fixed stages
              FIXED_STAGES.map((stage) => {
                const stageReqs = requirements.filter(r => r.stageId === stage.id);
                if (stageReqs.length === 0) return null;
                
                return (
                  <div key={stage.id} className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {stage.name}
                    </h4>
                    {stageReqs.map((req) => {
                      const status = req.status || 'pending';
                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          data-testid={`doc-row-${req.id}-${client.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{req.title}</p>
                              {req.description && (
                                <p className="text-xs text-muted-foreground">{req.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(status))}>
                              {getStatusLabel(status)}
                            </span>
                            {req.fileUrl && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = req.fileUrl!;
                                    link.download = req.fileName || 'document';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  data-testid={`button-download-req-${req.id}`}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                {(status === "uploaded" || status === "in_review") && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => onApproveRequirement(req)}
                                      data-testid={`button-approve-req-${req.id}`}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-600 hover:bg-red-50"
                                      onClick={() => onRejectRequirement(req)}
                                      data-testid={`button-reject-req-${req.id}`}
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              // Fallback to REQUIRED_DOCUMENTS
              REQUIRED_DOCUMENTS.map((reqDoc) => {
                const { status, doc } = getDocStatus(reqDoc.type);
                return (
                  <div
                    key={reqDoc.type}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    data-testid={`doc-row-${reqDoc.type}-${client.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{reqDoc.name}</p>
                        <p className="text-xs text-muted-foreground">{reqDoc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(status))}>
                        {getStatusLabel(status)}
                      </span>
                      {doc && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onPreview(doc)}
                            data-testid={`button-preview-${reqDoc.type}-${client.id}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {(status === "uploaded" || status === "in_review") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => onApprove(doc)}
                                data-testid={`button-approve-${reqDoc.type}-${client.id}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:bg-red-50"
                                onClick={() => onReject(doc)}
                                data-testid={`button-reject-${reqDoc.type}-${client.id}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyOverview() {
  const [, params] = useRoute("/agent/property/:id");
  const [, setLocation] = useLocation();
  const { data: property, isLoading, error } = useProperty(params?.id);
  const { data: propertyClients = [], isLoading: clientsLoading } = usePropertyClients(params?.id);
  const { data: documents = [] } = usePropertyDocuments(params?.id || "");
  const { data: reports = [] } = usePropertyReports(params?.id);
  const { user } = useAuth();
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  const addClientMutation = useAddPropertyClient();
  const removeClientMutation = useRemovePropertyClient();
  const updateDocumentMutation = useUpdateDocumentStatus();
  const updateReportMutation = useUpdateReportStatus();
  const createChecklistSnapshot = useCreateChecklistSnapshot();
  const updateChecklistReqMutation = useUpdateClientChecklistRequirement();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<PropertyClientWithUser | null>(null);
  const [deleteClientStep, setDeleteClientStep] = useState<0 | 1 | 2>(0);
  const [isEndTenancyFlow, setIsEndTenancyFlow] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PropertyClientWithUser | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [rejectDoc, setRejectDoc] = useState<Document | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReq, setRejectReq] = useState<ClientChecklistRequirement | null>(null);
  const [rejectReqReason, setRejectReqReason] = useState("");

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
      case "vacant": return "Vacant";
      case "onboarding_in_progress": return "Awaiting Documents";
      case "onboarding_ready_to_confirm": return "In Review";
      case "approved_active_tenancy": return "Approved";
      default: return "Vacant";
    }
  };

  const getOverallStage = () => {
    if (propertyClients.length === 0) return "Vacant";
    const allApproved = propertyClients.every(c => c.lifecycleStatus === "approved_active_tenancy");
    const anyInReview = propertyClients.some(c => c.lifecycleStatus === "onboarding_ready_to_confirm");
    if (allApproved) return "Approved";
    if (anyInReview) return "In Review";
    return "Awaiting Documents";
  };

  const currentStage = getOverallStage();

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const handleApproveDoc = async (doc: Document) => {
    try {
      await updateDocumentMutation.mutateAsync({
        documentId: doc.id,
        status: "approved",
      });
      toast({
        title: "Document Approved",
        description: `${doc.name} has been approved.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to approve document",
        variant: "destructive",
      });
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectDoc) return;
    try {
      await updateDocumentMutation.mutateAsync({
        documentId: rejectDoc.id,
        status: "rejected",
        rejectionReason: rejectReason,
      });
      toast({
        title: "Re-upload Requested",
        description: `Client has been notified to re-upload ${rejectDoc.name}.`,
      });
      setRejectDoc(null);
      setRejectReason("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reject document",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequirement = async (req: ClientChecklistRequirement) => {
    try {
      await updateChecklistReqMutation.mutateAsync({
        id: req.id,
        propertyId: property!.id,
        clientId: req.clientId,
        status: "approved",
      });
      toast({
        title: "Document Approved",
        description: `${req.title} has been approved.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to approve document",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequirement = async () => {
    if (!rejectReq) return;
    try {
      await updateChecklistReqMutation.mutateAsync({
        id: rejectReq.id,
        propertyId: property!.id,
        clientId: rejectReq.clientId,
        status: "rejected",
        rejectionReason: rejectReqReason,
      });
      toast({
        title: "Re-upload Requested",
        description: `Client has been notified to re-upload ${rejectReq.title}.`,
      });
      setRejectReq(null);
      setRejectReqReason("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reject document",
        variant: "destructive",
      });
    }
  };

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
    if (!newClientForm.clientEmail || !newClientForm.clientName) {
      toast({
        title: "Error",
        description: "Client email and name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addClientMutation.mutateAsync({
        propertyId: property.id,
        data: {
          clientEmail: newClientForm.clientEmail,
          clientName: newClientForm.clientName,
          clientPhone: newClientForm.clientPhone || undefined,
          clientDateOfBirth: newClientForm.clientDateOfBirth ? new Date(newClientForm.clientDateOfBirth).toISOString() : undefined,
        },
      });
      
      // Note: Checklist snapshot is automatically created by the backend when client is added
      
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

  const handleRemoveClient = async (clientId: string, endTenancy: boolean = false) => {
    try {
      await removeClientMutation.mutateAsync({
        propertyId: property.id,
        clientId,
        endTenancy,
      });
      toast({
        title: endTenancy ? "Tenancy Ended" : "Client Removed",
        description: endTenancy 
          ? "The tenancy has been ended and all associated data has been deleted." 
          : "The client has been removed from this property.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || (endTenancy ? "Failed to end tenancy" : "Failed to remove client"),
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

  const totalDocs = documents.length;
  const approvedDocs = documents.filter(d => d.status === "approved").length;
  const pendingDocs = documents.filter(d => d.status === "uploaded" || d.status === "in_review").length;
  const openReports = reports.filter(r => r.status === "open");
  const resolvedReports = reports.filter(r => r.status === "resolved");

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateReportMutation.mutateAsync({ reportId, status: "resolved" });
      toast({
        title: "Report Resolved",
        description: "The report has been marked as resolved.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resolve report",
        variant: "destructive",
      });
    }
  };

  const getReportClientName = (userId: string) => {
    const client = propertyClients.find(c => c.userId === userId);
    return client?.clientName || client?.user?.firstName || "Client";
  };

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        {/* Header Row - using same grid as main content for alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent">
                <Button variant="ghost" size="icon" className="shrink-0" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground">{property.address}</h1>
                <div className="flex items-center text-muted-foreground text-sm mt-0.5">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {property.city}, {property.postcode}
                </div>
              </div>
            </div>
            <StatusBadge status={currentStage as any} />
          </div>
          <div className="lg:col-span-4 flex items-center justify-end gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (propertyClients.length > 0 && propertyClients[0].userId) {
                  setSelectedClient(propertyClients[0]);
                  setIsChatOpen(true);
                }
              }}
              disabled={!propertyClients.some(c => c.userId)}
              data-testid="button-header-messages"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Messages
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsReportsDialogOpen(true)}
              className={cn(openReports.length > 0 && "border-orange-400 text-orange-600 hover:bg-orange-50")}
              data-testid="button-header-reports"
            >
              <AlertTriangle className={cn("h-4 w-4 mr-1.5", openReports.length > 0 && "text-orange-500")} />
              Reports
              {openReports.length > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {openReports.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Main Grid: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tabbed Content (65-70%) */}
          <div className="lg:col-span-8 space-y-4">
            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="documents" className="flex items-center gap-2" data-testid="tab-documents">
                  <ClipboardList className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="welcome-pack" className="flex items-center gap-2" data-testid="tab-welcome-pack">
                  <Package className="h-4 w-4" />
                  Welcome Pack
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Document Checklist
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{approvedDocs} approved</span>
                        <span>{pendingDocs} pending review</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {clientsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : propertyClients.length > 0 ? (
                      propertyClients.map((client) => (
                        <ClientChecklistSection
                          key={client.id}
                          client={client}
                          propertyId={property.id}
                          documents={documents}
                          isExpanded={expandedClients.has(client.id)}
                          onToggle={() => toggleClientExpanded(client.id)}
                          onPreview={(doc) => setPreviewDoc(doc)}
                          onApprove={handleApproveDoc}
                          onReject={(doc) => setRejectDoc(doc)}
                          onApproveRequirement={handleApproveRequirement}
                          onRejectRequirement={(req) => setRejectReq(req)}
                          onMessage={() => {
                            setSelectedClient(client);
                            setIsChatOpen(true);
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 border rounded-lg bg-slate-50">
                        <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Users className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-muted-foreground mb-1">No clients assigned yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Add clients to start the document collection workflow</p>
                        <Button variant="outline" size="sm" onClick={handleOpenAddClientDialog} data-testid="button-add-client-empty">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Client
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="welcome-pack">
                <Card>
                  <CardContent className="pt-6">
                    <WelcomePackEditor propertyId={property.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Clients + Summary + Quick Actions (30-35%) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Clients Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clients ({propertyClients.length})
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleOpenAddClientDialog}
                    data-testid="button-add-client"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {propertyClients.length > 0 ? (
                  propertyClients.map((client) => (
                    <button 
                      key={client.id} 
                      className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                      onClick={() => {
                        setViewingClient(client);
                        setDeleteClientStep(0);
                      }}
                      data-testid={`client-card-${client.id}`}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={client.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">{getClientInitials(client)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{getClientDisplayName(client)}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.clientEmail}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No clients assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Tenancy Summary Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif">Tenancy Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <PoundSterling className="h-3.5 w-3.5" />
                    Monthly Rent
                  </span>
                  <span className="font-medium">{property.price || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Start Date
                  </span>
                  <span className="font-medium">TBC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Guarantor Required</span>
                  <span className="font-medium">{property.guarantorRequired ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{property.status}</span>
                </div>
                {property.imageUrl && (
                  <div className="pt-2">
                    <img 
                      src={property.imageUrl} 
                      alt={property.address}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rent Schedule Card */}
            <RentScheduleCard propertyId={property.id} />
          </div>
        </div>
      </div>

      {/* Edit Property Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property details and tenancy information
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
                placeholder="£2,500"
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

      {/* Delete Property Dialog */}
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

      {/* Add Client Dialog */}
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

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewDoc?.fileUrl ? (
              <div className="border rounded-lg overflow-hidden bg-slate-50">
                {previewDoc.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={previewDoc.fileUrl} alt={previewDoc.name} className="w-full max-h-96 object-contain" />
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <a 
                      href={previewDoc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open document in new tab
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={!!rejectDoc} onOpenChange={() => { setRejectDoc(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Re-upload</DialogTitle>
            <DialogDescription>
              Explain why this document needs to be re-uploaded. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Document is expired, image is unclear, wrong document type..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDoc(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectDoc}
              disabled={!rejectReason.trim()}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Checklist Requirement Dialog */}
      <Dialog open={!!rejectReq} onOpenChange={() => { setRejectReq(null); setRejectReqReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Re-upload</DialogTitle>
            <DialogDescription>
              Explain why this document needs to be re-uploaded. The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Document is expired, image is unclear, wrong document type..."
              value={rejectReqReason}
              onChange={(e) => setRejectReqReason(e.target.value)}
              rows={3}
              data-testid="input-reject-req-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectReq(null); setRejectReqReason(""); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectRequirement}
              disabled={!rejectReqReason.trim()}
              data-testid="button-confirm-reject-req"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Profile Dialog */}
      <Dialog 
        open={!!viewingClient} 
        onOpenChange={(open) => {
          if (!open) {
            setViewingClient(null);
            setDeleteClientStep(0);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={viewingClient?.user?.profileImageUrl || undefined} />
                <AvatarFallback>{viewingClient ? getClientInitials(viewingClient) : ''}</AvatarFallback>
              </Avatar>
              <div>
                <span className="block">{viewingClient ? getClientDisplayName(viewingClient) : ''}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {viewingClient?.userId ? 'Active Client' : 'Pending Login'}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewingClient && deleteClientStep === 0 && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{viewingClient.clientEmail}</p>
                  </div>
                </div>
                
                {viewingClient.clientPhone && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{viewingClient.clientPhone}</p>
                    </div>
                  </div>
                )}
                
                {viewingClient.clientDateOfBirth && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-sm font-medium">
                        {new Date(viewingClient.clientDateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Onboarding Status</p>
                    <p className="text-sm font-medium">{getStageFromLifecycle(viewingClient.lifecycleStatus)}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteClientStep(1)}
                  data-testid="button-delete-client-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Client
                </Button>
              </div>
            </div>
          )}
          
          {viewingClient && deleteClientStep === 1 && (
            <div className="space-y-4 py-4">
              {propertyClients.length === 1 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">End Tenancy?</p>
                      <p className="text-sm text-red-700 mt-1">
                        This is the last client on this property. Removing them will end the tenancy and permanently delete:
                      </p>
                      <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                        <li>All message history</li>
                        <li>All uploaded documents</li>
                        <li>All reports and issues</li>
                        <li>All payment records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Are you sure?</p>
                      <p className="text-sm text-amber-700 mt-1">
                        This will remove {getClientDisplayName(viewingClient)} from this property. 
                        All their uploaded documents will also be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteClientStep(0)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteClientStep(2)}
                  className="flex-1"
                  data-testid="button-delete-client-confirm-1"
                >
                  {propertyClients.length === 1 ? "End Tenancy" : "Yes, Remove Client"}
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {viewingClient && deleteClientStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Final Confirmation</p>
                    <p className="text-sm text-red-700 mt-1">
                      {propertyClients.length === 1 
                        ? "This action cannot be undone. All tenancy data will be permanently deleted."
                        : "This action cannot be undone. The client will lose access to this property immediately."
                      }
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewingClient(null);
                    setDeleteClientStep(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (viewingClient) {
                      await handleRemoveClient(viewingClient.id, propertyClients.length === 1);
                      setViewingClient(null);
                      setDeleteClientStep(0);
                    }
                  }}
                  disabled={removeClientMutation.isPending}
                  className="flex-1"
                  data-testid="button-delete-client-confirm-final"
                >
                  {removeClientMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {propertyClients.length === 1 ? "Ending Tenancy..." : "Removing..."}</>
                  ) : (
                    propertyClients.length === 1 ? "End Tenancy Permanently" : "Delete Permanently"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={isReportsDialogOpen} onOpenChange={setIsReportsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Property Reports
            </DialogTitle>
            <DialogDescription>
              Review and manage reports submitted by clients
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {openReports.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-orange-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  Open Reports ({openReports.length})
                </h4>
                {openReports.map((report) => (
                  <div key={report.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="font-medium text-foreground">{getReportClientName(report.userId)}</span>
                          <span>•</span>
                          <span className="capitalize">{report.category}</span>
                          <span>•</span>
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm">{report.description}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full capitalize",
                        report.priority === "high" ? "bg-red-100 text-red-700" :
                        report.priority === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {report.priority}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const client = propertyClients.find(c => c.userId === report.userId);
                          if (client) {
                            setSelectedClient(client);
                            setIsChatOpen(true);
                            setIsReportsDialogOpen(false);
                          }
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Message Client
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleResolveReport(report.id)}
                        disabled={updateReportMutation.isPending}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {openReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No open reports</p>
                <p className="text-xs mt-1">All client reports have been resolved</p>
              </div>
            )}

            {resolvedReports.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Report History ({resolvedReports.length})
                </h4>
                {resolvedReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="border rounded-lg p-3 bg-slate-50 opacity-70">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium">{getReportClientName(report.userId)}</span>
                      <span>•</span>
                      <span className="capitalize">{report.category}</span>
                      <span>•</span>
                      <span className="text-emerald-600">Resolved</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messaging Panel */}
      {selectedClient && property && (
        <MessagingPanel 
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedClient(null);
          }}
          client={{ 
            id: selectedClient.userId || selectedClient.id, 
            name: selectedClient.clientName || selectedClient.user?.firstName || 'Client', 
            email: selectedClient.clientEmail 
          }}
          propertyId={property.id}
          propertyAddress={property.address}
          currentUserType="agent"
          currentUserId={user?.id}
        />
      )}
    </Layout>
  );
}
