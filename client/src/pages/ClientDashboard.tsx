import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS, CURRENT_AGENT, BANK_DETAILS, JOURNEY_STAGES } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { TenancyJourney } from "@/components/TenancyJourney";
import { Link } from "wouter";
import { 
  ArrowRight, 
  FileCheck, 
  CheckCircle2, 
  Circle, 
  Phone, 
  Mail, 
  MapPin,
  Home,
  Calendar,
  PartyPopper,
  Clock,
  MessageSquare,
  AlertCircle,
  History,
  Send,
  AlertTriangle,
  CreditCard,
  Copy
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sharedStore, RentPayment, RentStatus, ClientReport } from "@/lib/sharedStore";
import { MessagingPanel } from "@/components/MessagingPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function ClientDashboard() {
  const property = MOCK_PROPERTIES[0];
  const client = MOCK_CLIENTS[0];
  
  // Toggle to demo both states (in real app this would be based on property.stage)
  const [isComplete, setIsComplete] = useState(false);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Report State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBankDetailsOpen, setIsBankDetailsOpen] = useState(false);
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const [replyText, setReplyText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [reportForm, setReportForm] = useState({
    category: "",
    priority: "medium",
    description: ""
  });

  useEffect(() => {
    // Load initial data
    setPayments(sharedStore.getRentSchedule(property.id));
    setReports(sharedStore.getReports(property.id).filter(r => r.clientId === client.id));
    
    const msgs = sharedStore.getMessages(property.id);
    const unread = msgs.filter(m => m.receiverId === client.id && !m.read).length;
    setUnreadCount(unread);
    
    // Subscribe to changes
    const unsubscribe = sharedStore.subscribe(() => {
      setPayments(sharedStore.getRentSchedule(property.id));
      setReports(sharedStore.getReports(property.id).filter(r => r.clientId === client.id));
      
      const updatedMsgs = sharedStore.getMessages(property.id);
      const updatedUnread = updatedMsgs.filter(m => m.receiverId === client.id && !m.read).length;
      setUnreadCount(updatedUnread);

      // Update selected report if open
      if (selectedReport) {
        const updated = sharedStore.getReports(property.id).find(r => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
      }
    });
    
    return unsubscribe;
  }, [property.id, client.id, selectedReport?.id]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    sharedStore.markMessagesAsRead(property.id, client.id);
    setUnreadCount(0);
  };
  
  // Determine current stage based on document status
  const currentStageIndex = JOURNEY_STAGES.findIndex(stage => {
    // A stage is incomplete if any of its requirements are NOT approved
    // If it has no requirements found in the property docs, it is also considered incomplete (unless we assume implicit completion?)
    // Prompt says: "A stage is COMPLETE when all its linked requirementIds are in 'Approved' status."
    // We strictly check for approved status.
    const stageDocs = property.documents.filter(doc => stage.requirementIds.includes(doc.id));
    
    // If no docs linked, it can't be approved? Or is it auto-approved?
    // Using previous logic: must have docs and all must be approved.
    const isComplete = stageDocs.length > 0 && stageDocs.every(doc => doc.status === 'approved');
    return !isComplete;
  });

  const currentStage = currentStageIndex === -1 ? null : JOURNEY_STAGES[currentStageIndex];
  
  // Filter documents for the current stage
  const displayedDocs = currentStage
    ? property.documents.filter(doc => currentStage.requirementIds.includes(doc.id))
    : [];

  const approvedDocs = property.documents.filter(d => d.status === 'approved').length;
  const totalDocs = property.documents.length;
  const progress = isComplete ? 100 : (approvedDocs / totalDocs) * 100;
  
  const pendingDocs = property.documents.filter(d => d.status === 'pending' || d.status === 'rejected');
  
  // Rent schedule for complete state
  // Sort payments by due date
  const sortedPayments = [...payments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const upcomingPayments = sortedPayments.filter(p => p.status !== 'paid').slice(0, 3);
  const nextPayment = upcomingPayments[0];

  const togglePaymentPaid = (id: string, currentStatus: RentStatus) => {
    // Client logic: 
    // If unpaid -> pending
    // If pending -> unpaid (undo)
    // If paid -> do nothing (verified)
    
    if (currentStatus === 'paid') return;
    
    const newStatus: RentStatus = currentStatus === 'unpaid' ? 'pending' : 'unpaid';
    
    sharedStore.updateRentPayment(property.id, id, { status: newStatus });
    
    if (newStatus === 'pending') {
      toast({ title: "Payment Reported", description: "Agent will verify your payment shortly." });
    }
  };

  const submitReport = () => {
    if (!reportForm.category || !reportForm.description) return;
    
    sharedStore.addReport({
      id: `rep_${Date.now()}`,
      clientId: client.id,
      propertyId: property.id,
      category: reportForm.category as any,
      priority: reportForm.priority as any,
      description: reportForm.description,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: []
    });
    
    toast({ title: "Issue Reported", description: "Your agent has been notified." });
    setIsReportOpen(false);
    setReportForm({ category: "", priority: "medium", description: "" });
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedReport) return;

    sharedStore.addReportMessage(property.id, selectedReport.id, {
      id: `msg_${Date.now()}`,
      senderId: client.id,
      senderName: client.name,
      content: replyText,
      timestamp: new Date().toISOString(),
      isAdmin: false
    });

    setReplyText("");
  };

  return (
    <Layout userType="client">
      <div className="min-h-[calc(100vh-8rem)] relative">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {isComplete ? `Welcome home, ${client.name.split(' ')[0]}` : `Welcome, ${client.name.split(' ')[0]}`}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isComplete 
                  ? "Your property is ready. Here's everything you need." 
                  : "Complete the steps below to finalize your property transaction."}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsHistoryOpen(true)}
                className="text-xs"
              >
                <History className="h-3.5 w-3.5 mr-2" />
                My Reports
                {reports.filter(r => r.status === 'open').length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                    {reports.filter(r => r.status === 'open').length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsReportOpen(true)}
                className="text-xs"
              >
                <AlertCircle className="h-3.5 w-3.5 mr-2" />
                Report Issue
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsComplete(!isComplete)}
                className="text-xs"
              >
                Demo: {isComplete ? "Show In Progress" : "Show Complete"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Hero Card - Replaced with Tenancy Journey */}
            <TenancyJourney 
              stages={JOURNEY_STAGES} 
              property={property} 
              forceComplete={isComplete}
            />

            {/* Conditional Content Based on State */}
            {isComplete ? (
              /* COMPLETE STATE - Rent Schedule */
              <Card className="bg-white border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-serif flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    Rent Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextPayment && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Next Payment Due</p>
                          <p className="text-2xl font-serif font-bold text-foreground">
                            £{nextPayment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium text-foreground">
                            {format(new Date(nextPayment.dueDate), "d MMMM yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Payment History</p>
                    {sortedPayments.slice(0, 5).map((payment) => (
                      <div 
                        key={payment.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-colors",
                          payment.status === 'paid' ? "bg-green-50/50" : "bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {payment.status === 'paid' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-sm",
                            payment.status === 'paid' ? "text-muted-foreground" : "text-foreground font-medium"
                          )}>
                            {format(new Date(payment.dueDate), "d MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "font-medium tabular-nums",
                            payment.status === 'paid' ? "text-muted-foreground" : "text-foreground"
                          )}>
                            £{payment.amount.toLocaleString()}
                          </span>
                          
                          {payment.status === 'paid' && (
                            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                              Verified
                            </span>
                          )}

                          {payment.status !== 'paid' && (
                             <div className="flex items-center gap-2">
                               {payment.status === 'pending' && <span className="text-xs text-orange-600 font-medium">Pending Verification</span>}
                               <Checkbox 
                                 checked={payment.status === 'pending'} 
                                 onCheckedChange={() => togglePaymentPaid(payment.id, payment.status)}
                                 className={cn(
                                   payment.status === 'pending' && "border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                 )}
                               />
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* IN PROGRESS STATE - Document Checklist */
              <Card className="bg-white border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-serif">Complete Your Documents</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentStage 
                      ? `Upload the required documents to complete: ${currentStage.title}`
                      : "Upload the required documents to proceed"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">
                  {displayedDocs.length > 0 ? (
                    displayedDocs.map((doc, index) => {
                    const isApproved = doc.status === 'approved';
                    const isInReview = doc.status === 'in_review';
                    const isPending = doc.status === 'pending';
                    const isRejected = doc.status === 'rejected';
                    
                    return (
                      <div 
                        key={doc.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all",
                          isApproved && "bg-green-50/50 border-green-200/50",
                          isInReview && "bg-amber-50/50 border-amber-200/50",
                          isPending && "bg-white border-border/60 hover:border-primary/30 hover:shadow-sm cursor-pointer",
                          isRejected && "bg-red-50/50 border-red-200/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                            isApproved && "bg-green-100 text-green-600",
                            isInReview && "bg-amber-100 text-amber-600",
                            isPending && "bg-slate-100 text-slate-400",
                            isRejected && "bg-red-100 text-red-600"
                          )}>
                            {isApproved ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium",
                              isApproved ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {doc.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          </div>
                        </div>
                        
                        <div className="shrink-0">
                          {isApproved && (
                            <span className="text-xs text-green-600 font-medium">Approved</span>
                          )}
                          {isInReview && (
                            <span className="text-xs text-amber-600 font-medium">In Review</span>
                          )}
                          {isPending && (
                            <Link href="/client/upload">
                              <Button size="sm" className="h-8">
                                Upload <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </Link>
                          )}
                          {isRejected && (
                            <Link href="/client/upload">
                              <Button size="sm" variant="destructive" className="h-8">
                                Re-upload
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No uploads needed for this stage.</p>
                      <p className="text-sm opacity-70 mt-1">Please wait for your agent to review your application.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="flex flex-col gap-6 h-full">
            {/* Agent Contact Card - Always Visible */}
            <Card className="bg-white border-border/60 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-serif">Your Agent</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                  onClick={() => setIsBankDetailsOpen(true)}
                >
                  <CreditCard className="h-3 w-3 mr-1.5" />
                  Bank Details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarImage src={CURRENT_AGENT.avatar} />
                    <AvatarFallback className="font-serif">JS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{CURRENT_AGENT.name}</p>
                    <p className="text-sm text-muted-foreground">Senior Property Agent</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-start gap-2 relative" 
                    variant="default"
                    onClick={handleOpenChat}
                  >
                    <MessageSquare className="h-4 w-4" /> Message Agent
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>

                  <a 
                    href="tel:+442071234567" 
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="p-2 bg-white rounded-md shadow-sm group-hover:shadow transition-shadow">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium text-foreground">+44 20 7123 4567</p>
                    </div>
                  </a>
                  
                  <a 
                    href="mailto:james.sterling@slatestone.co.uk" 
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="p-2 bg-white rounded-md shadow-sm group-hover:shadow transition-shadow">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">james.sterling@slatestone.co.uk</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary Card */}
            <Card className="bg-white border-border/60 shadow-sm flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif">
                  {isComplete ? "Property Details" : "Application Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isComplete ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Rent</span>
                      <span className="font-medium">£1,200</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tenancy Start</span>
                      <span className="font-medium">1 Oct 2026</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tenancy End</span>
                      <span className="font-medium">30 Sep 2027</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deposit</span>
                      <span className="font-medium text-green-600">Protected</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Documents Approved</span>
                      <span className="font-medium text-green-600">{approvedDocs}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Awaiting Upload</span>
                      <span className="font-medium text-amber-600">{pendingDocs.length}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">In Review</span>
                      <span className="font-medium">{property.documents.filter(d => d.status === 'in_review').length}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Required</span>
                      <span className="font-medium">{totalDocs}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Floating Chat Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Messaging Panel */}
      <MessagingPanel 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        client={client}
        propertyAddress={property.address}
        currentUserType="client"
      />

      {/* Report Issue Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>Let your agent know about any problems or requests.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={reportForm.category} 
                onValueChange={(val) => setReportForm({ ...reportForm, category: val })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                  <SelectItem value="admin">Administrative / Documents</SelectItem>
                  <SelectItem value="urgent">Urgent / Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={reportForm.priority} 
                onValueChange={(val) => setReportForm({ ...reportForm, priority: val })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - When possible</SelectItem>
                  <SelectItem value="medium">Medium - Standard request</SelectItem>
                  <SelectItem value="high">High - Urgent attention needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the issue in detail..."
                rows={4}
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} className={cn(reportForm.priority === 'high' && "bg-red-600 hover:bg-red-700")}>
              {reportForm.priority === 'high' ? 'Submit Urgent Report' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Report History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] h-[70vh] flex flex-col p-0">
          <div className="flex flex-1 overflow-hidden h-full">
            {/* Sidebar List */}
            <div className="w-5/12 border-r flex flex-col bg-slate-50/50">
              <div className="p-4 border-b bg-white">
                <h3 className="font-serif font-medium">Your Reports</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {reports.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No reports yet.
                    </div>
                  ) : (
                    reports.map(report => (
                      <div 
                        key={report.id}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-slate-100 transition-colors",
                          selectedReport?.id === report.id && "bg-slate-100"
                        )}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <Badge variant={report.status === 'open' ? 'default' : 'secondary'} className="text-[10px] h-5">
                            {report.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(report.createdAt), "d MMM")}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">{report.category}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {report.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="w-7/12 flex flex-col bg-white">
              {selectedReport ? (
                <>
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={selectedReport.priority === 'high' ? 'destructive' : 'secondary'}>
                        {selectedReport.priority} priority
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize">• {selectedReport.category}</span>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                      <p className="text-base text-foreground bg-slate-50 p-4 rounded-lg border">
                        "{selectedReport.description}"
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">Need to discuss this?</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-6">
                      If you need to provide more details or ask for updates, please use the main chat.
                    </p>
                    <Button onClick={() => {
                      setIsHistoryOpen(false);
                      setIsChatOpen(true);
                    }}>
                      Open Chat with Agent
                    </Button>
                  </div>

                  {selectedReport.status !== 'open' && (
                    <div className="p-4 border-t bg-slate-50 text-center text-sm text-muted-foreground">
                      This report has been marked as {selectedReport.status}.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Select a report to view details
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Bank Details Modal */}
      <Dialog open={isBankDetailsOpen} onOpenChange={setIsBankDetailsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="text-center pb-4 border-b">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-serif">Bank Details</DialogTitle>
            <DialogDescription>
              Use these details to make rent payments or deposits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-5">
            {[
              { label: "Account Name", value: BANK_DETAILS.accountName, mono: false },
              { label: "Bank Name", value: BANK_DETAILS.bankName, mono: false },
              { label: "Sort Code", value: BANK_DETAILS.sortCode, mono: true },
              { label: "Account Number", value: BANK_DETAILS.accountNumber, mono: true },
              { label: "IBAN", value: BANK_DETAILS.iban, mono: true },
              { label: "BIC / SWIFT", value: BANK_DETAILS.bic, mono: true }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="space-y-1">
                   <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                   <p className={cn("text-base font-medium text-foreground selection:bg-primary/20", item.mono && "font-mono")}>
                     {item.value}
                   </p>
                </div>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground hover:bg-slate-100"
                   onClick={() => {
                     navigator.clipboard.writeText(item.value);
                     toast({ title: "Copied", description: `${item.label} copied to clipboard.` });
                   }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="sm:justify-center border-t pt-4">
             <Button 
               className="w-full sm:w-auto"
               onClick={() => {
                 const text = `Account Name: ${BANK_DETAILS.accountName}\nBank: ${BANK_DETAILS.bankName}\nSort Code: ${BANK_DETAILS.sortCode}\nAccount Number: ${BANK_DETAILS.accountNumber}\nIBAN: ${BANK_DETAILS.iban}\nBIC: ${BANK_DETAILS.bic}`;
                 navigator.clipboard.writeText(text);
                 toast({ title: "Copied All", description: "Full bank details copied to clipboard." });
               }}
             >
               <Copy className="h-4 w-4 mr-2" />
               Copy All Details
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
