import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS, CURRENT_AGENT, BANK_DETAILS, JOURNEY_STAGES } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { TenancyJourney } from "@/components/TenancyJourney";
import { HelpLinksModal } from "@/components/HelpLinksModal";
import { WelcomePack } from "@/components/WelcomePack";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Copy,
  BookOpen,
  Wifi,
  Wrench,
  Check,
  Info,
  ChevronRight,
  CheckCircle,
  Link as LinkIcon
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

// Celebration Component
function CelebrationOverlay({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center">
        {/* Sliding Lock Animation */}
        <div className="relative w-80 h-28 bg-slate-100 rounded-full p-2 shadow-inner border border-slate-200 mb-8 overflow-hidden">
           <motion.div 
              className="absolute inset-y-0 left-0 bg-green-500/10 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
           />
           
           <motion.div
             className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center absolute top-2 z-10 border border-slate-100"
             initial={{ x: 0 }}
             animate={{ 
               x: 208, // 80 * 4 = 320px width - 24 * 4 = 96px knob - 16px padding = 208px travel
               backgroundColor: "#22c55e",
               borderColor: "#22c55e"
             }}
             transition={{ 
               type: "spring", 
               stiffness: 70, 
               damping: 15,
               delay: 0.2 
             }}
           >
             <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
             >
                <Check className="h-12 w-12 text-white stroke-[3]" />
             </motion.div>
           </motion.div>
           
           <div className="absolute inset-0 flex items-center justify-center px-10 text-sm font-medium tracking-widest uppercase text-slate-400 select-none pointer-events-none">
              <span className="text-green-600/0 animate-in fade-in duration-500 delay-700 fill-mode-forwards">Confirmed</span>
           </div>
        </div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-4xl font-serif font-bold text-foreground mb-3"
        >
          Welcome Home!
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-lg text-muted-foreground"
        >
          Your tenancy is officially confirmed.
        </motion.p>

        {/* CSS Particles/Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][i % 4],
                        left: '50%',
                        top: '50%'
                    }}
                    animate={{
                        x: (Math.random() - 0.5) * 800,
                        y: (Math.random() - 0.5) * 800,
                        opacity: [1, 0],
                        scale: [0, 1.5],
                        rotate: Math.random() * 360
                    }}
                    transition={{
                        delay: 0.8, // Sync with text appearance
                        duration: 1.5,
                        ease: "easeOut"
                    }}
                />
             ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ClientDashboard() {
  const property = MOCK_PROPERTIES[0];
  const client = MOCK_CLIENTS[0];
  
  // State for Lifecycle Status
  const [lifecycleStatus, setLifecycleStatus] = useState<'onboarding_in_progress' | 'onboarding_ready_to_confirm' | 'approved_active_tenancy'>(
    (property.clientLifecycleStatus as any) || 'onboarding_in_progress'
  );
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isComplete, setIsComplete] = useState(false); // Legacy for transition logic if needed, but primarily relying on lifecycleStatus
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [affordabilityPath, setAffordabilityPath] = useState<'employment' | 'student' | null>(null);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Report State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBankDetailsOpen, setIsBankDetailsOpen] = useState(false);
  const [isWelcomePackOpen, setIsWelcomePackOpen] = useState(false);
  const [isHelpLinksOpen, setIsHelpLinksOpen] = useState(false);
  
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const [replyText, setReplyText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [reportForm, setReportForm] = useState({
    category: "",
    priority: "medium",
    description: ""
  });

  // Check if we are in "Active Tenancy" mode
  const isActiveTenancy = lifecycleStatus === 'approved_active_tenancy';
  const isReadyToConfirm = lifecycleStatus === 'onboarding_ready_to_confirm';

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
  
  const handleConfirmTenancy = () => {
      setShowCelebration(true);
      // Actual state transition happens after animation in CelebrationOverlay onComplete
  };

  const onCelebrationComplete = () => {
      setShowCelebration(false);
      setLifecycleStatus('approved_active_tenancy');
  };

  // Determine current stage based on document status
  const currentStageIndex = JOURNEY_STAGES.findIndex(stage => {
    // If ready to confirm, show all stages as complete (so index is -1 or last one logic needs care)
    // Actually, if ready to confirm, all docs are approved, so standard logic works.
    
    // Custom Logic for Affordability Stage (Stage 4)
    if (stage.id === 'stage_4') {
        const empDocs = property.documents.filter(d => d.path === 'employment');
        const stuDocs = property.documents.filter(d => d.path === 'student');
        const guaDocs = property.documents.filter(d => d.isGuarantor);

        const empApproved = empDocs.length > 0 && empDocs.every(d => d.status === 'approved');
        const stuApproved = stuDocs.length > 0 && stuDocs.every(d => d.status === 'approved');
        
        // Guarantor check
        const guarantorRequired = property.guarantorRequired;
        const guaApproved = !guarantorRequired || (guaDocs.length > 0 && guaDocs.every(d => d.status === 'approved'));

        // Complete if (Emp OR Stu) AND Gua
        const isComplete = (empApproved || stuApproved) && guaApproved;
        return !isComplete;
    }

    // Default Logic for other stages
    const stageDocs = property.documents.filter(doc => stage.requirementIds.includes(doc.id));
    const isComplete = stageDocs.length > 0 && stageDocs.every(doc => doc.status === 'approved');
    return !isComplete;
  });

  const currentStage = currentStageIndex === -1 ? null : JOURNEY_STAGES[currentStageIndex];
  
  // Filter documents for the current stage
  const displayedDocs = currentStage
    ? property.documents.filter(doc => {
        if (!currentStage.requirementIds.includes(doc.id)) return false;
        
        // Filter based on affordability path if we are in that stage
        if (currentStage.id === 'stage_4') {
            if (doc.path === 'employment' && affordabilityPath === 'student') return false;
            if (doc.path === 'student' && affordabilityPath === 'employment') return false;
            
            // If no path selected yet, show both (or neither?) - prompt says show both
            // But we might want to group them visually. For now, show all valid options.
            
            if (doc.isGuarantor && !property.guarantorRequired) return false;
        }
        return true;
    })
    : [];

  const approvedDocs = property.documents.filter(d => d.status === 'approved').length;
  const totalDocs = property.documents.length;
  const progress = isReadyToConfirm || isActiveTenancy ? 100 : (approvedDocs / totalDocs) * 100;
  
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
      <AnimatePresence>
         {showCelebration && <CelebrationOverlay onComplete={onCelebrationComplete} />}
      </AnimatePresence>

      <div className={cn("min-h-[calc(100vh-8rem)] relative transition-all duration-500", showCelebration && "blur-sm scale-95 opacity-50")}>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {isActiveTenancy 
                  ? "How can we help you today?" 
                  : isReadyToConfirm
                    ? `Welcome home, ${client.name.split(' ')[0]}` 
                    : `Welcome, ${client.name.split(' ')[0]}`
                }
              </h1>
              <p className="text-muted-foreground mt-1">
                {isActiveTenancy
                  ? "Quick links and information for your home."
                  : isReadyToConfirm 
                    ? "Your property is ready. Confirm to move in." 
                    : "Complete the steps below to finalize your property transaction."
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {isActiveTenancy && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsHelpLinksOpen(true)}
                  className="text-xs hidden sm:flex"
                >
                  <LinkIcon className="h-3.5 w-3.5 mr-2" />
                  Help Links
                </Button>
              )}
              
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
              
              {/* DEMO CONTROLS */}
              <div className="flex gap-1 ml-2">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        setLifecycleStatus('onboarding_in_progress');
                    }}
                    className={cn(
                        "text-xs opacity-50 hover:opacity-100",
                        lifecycleStatus === 'onboarding_in_progress' && "bg-slate-100 opacity-100 font-medium"
                    )}
                  >
                    Demo: In Progress
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        setLifecycleStatus('onboarding_ready_to_confirm');
                    }}
                    className={cn(
                        "text-xs opacity-50 hover:opacity-100",
                        lifecycleStatus === 'onboarding_ready_to_confirm' && "bg-green-50 border-green-200 text-green-700 opacity-100 font-medium"
                    )}
                  >
                    Demo: All Approved
                  </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {isActiveTenancy ? (
              /* ACTIVE TENANCY - EVERYDAY HOME VIEW */
              <>
                 {/* Quick Actions Card */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-border/60" onClick={handleOpenChat}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                             <MessageSquare className="h-6 w-6" />
                          </div>
                          <p className="font-medium text-sm">Message Agent</p>
                       </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-border/60" onClick={() => setIsReportOpen(true)}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                             <Wrench className="h-6 w-6" />
                          </div>
                          <p className="font-medium text-sm">Report Issue</p>
                       </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-border/60" onClick={() => setIsWelcomePackOpen(true)}>
                       <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                             <BookOpen className="h-6 w-6" />
                          </div>
                          <p className="font-medium text-sm">Welcome Pack</p>
                       </CardContent>
                    </Card>

                    <Link href="/client/upload">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-border/60 h-full">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                <FileCheck className="h-6 w-6" />
                            </div>
                            <p className="font-medium text-sm">My Documents</p>
                        </CardContent>
                        </Card>
                    </Link>
                 </div>

                 {/* Rent Schedule (Reused from Onboarding Complete) */}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </>
            ) : (
              /* ONBOARDING FLOW */
              <>
                {/* Property Hero Card - Replaced with Tenancy Journey */}
                <TenancyJourney 
                  stages={JOURNEY_STAGES} 
                  property={property} 
                  forceComplete={isReadyToConfirm} // Show journey as complete if ready to confirm
                />
                
                {/* CONFIRM TENANCY BUTTON - Only visible when ready to confirm */}
                {isReadyToConfirm && (
                   <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <PartyPopper className="h-6 w-6" />
                         </div>
                         <div>
                            <h3 className="text-lg font-serif font-medium text-foreground">You are all set!</h3>
                            <p className="text-muted-foreground text-sm">All documents have been approved. You can now confirm your tenancy.</p>
                         </div>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-8 shadow-lg shadow-green-200"
                        onClick={handleConfirmTenancy}
                      >
                        Confirm Tenancy
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                   </div>
                )}

                {/* Document Checklist - Hidden when ready to confirm (replaced by confirmation card above) or simplified */}
                {!isReadyToConfirm && (
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
              </>
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

            {/* GUIDANCE CARD (Replaces Application Status) */}
            <Card className="bg-white border-border/60 shadow-sm flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                   <AlertCircle className="h-5 w-5 text-primary" />
                   Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isActiveTenancy ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Everything looks good with your tenancy.</p>
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Bin collection is tomorrow. Check your welcome pack for details.</p>
                        </div>
                    </div>
                ) : isReadyToConfirm ? (
                   <div className="bg-green-50 p-4 rounded-lg flex gap-3 items-start">
                     <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                     <div>
                       <p className="font-medium text-green-800">Ready to move in?</p>
                       <p className="text-sm text-green-700 mt-1">Please click "Confirm Tenancy" to finalize your move-in process.</p>
                     </div>
                   </div>
                ) : currentStage ? (
                  <div className="space-y-3">
                    {currentStage.guidanceBullets && currentStage.guidanceBullets.map((bullet, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <p className="text-sm text-muted-foreground leading-relaxed">{bullet}</p>
                      </div>
                    ))}
                    {!currentStage.guidanceBullets && <p className="text-sm text-muted-foreground">Follow the checklist on the left.</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading guidance...</p>
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

      <HelpLinksModal 
        open={isHelpLinksOpen} 
        onOpenChange={setIsHelpLinksOpen} 
      />

      {/* Welcome Pack Modal */}
      <WelcomePack 
        isOpen={isWelcomePackOpen}
        onClose={() => setIsWelcomePackOpen(false)}
        slides={property.welcomePack || []}
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
            <Button onClick={submitReport}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report History Dialog */}
      <ReportHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reports={reports}
        onSelectReport={(report) => {
          setIsHistoryOpen(false);
          setSelectedReport(report);
        }}
      />
      
      {/* Report Detail Dialog */}
      <ClientReportDetailDialog 
        report={selectedReport} 
        onClose={() => setSelectedReport(null)} 
        onOpenChat={handleOpenChat}
      />

      {/* Bank Details Dialog */}
      <Dialog open={isBankDetailsOpen} onOpenChange={setIsBankDetailsOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-none shadow-xl rounded-2xl">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
             <div className="flex items-center justify-between mb-1">
               <h2 className="text-xl font-serif font-semibold text-slate-900">Bank Details</h2>
               {/* Close button is handled by DialogPrimitive but we can add a visual cue if needed, for now standard X is fine */}
             </div>
             <p className="text-sm text-slate-500">Use these details for rent and deposit transfers.</p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Account Name - Primary Block */}
            <div className="space-y-1.5 group">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Account Name</span>
               </div>
               <div className="flex items-center justify-between py-1">
                 <p className="text-lg font-medium text-slate-900">{BANK_DETAILS.accountName}</p>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      navigator.clipboard.writeText(BANK_DETAILS.accountName);
                      toast({ title: "Copied", description: "Account name copied" });
                    }}
                 >
                    <Copy className="h-4 w-4" />
                 </Button>
               </div>
               <Separator className="bg-slate-100" />
            </div>

            {/* Sort Code & Account Number - Split Row */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1.5 group">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Sort Code</span>
                 <div className="flex items-center justify-between py-1">
                   <p className="text-lg font-mono font-medium text-slate-900 tracking-tight">{BANK_DETAILS.sortCode}</p>
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(BANK_DETAILS.sortCode);
                        toast({ title: "Copied", description: "Sort code copied" });
                      }}
                   >
                      <Copy className="h-4 w-4" />
                   </Button>
                 </div>
                 <Separator className="bg-slate-100" />
              </div>

              <div className="space-y-1.5 group">
                 <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Account No.</span>
                 <div className="flex items-center justify-between py-1">
                   <p className="text-lg font-mono font-medium text-slate-900 tracking-tight">{BANK_DETAILS.accountNumber}</p>
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
                        toast({ title: "Copied", description: "Account number copied" });
                      }}
                   >
                      <Copy className="h-4 w-4" />
                   </Button>
                 </div>
                 <Separator className="bg-slate-100" />
              </div>
            </div>

            {/* Payment Reference - Calm Callout */}
            <div className="bg-slate-50/50 rounded-lg p-4 flex flex-col gap-1 border border-slate-100/50 group">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center gap-1.5">
                   <Info className="h-3 w-3 text-slate-400" />
                   Payment Reference
                 </span>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-all -mr-1"
                    onClick={() => {
                      navigator.clipboard.writeText("REF-KENS-12");
                      toast({ title: "Copied", description: "Reference copied" });
                    }}
                 >
                    <Copy className="h-3 w-3" />
                 </Button>
               </div>
               <p className="text-sm font-mono text-slate-700">REF-KENS-12</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-100">
             <p className="text-xs text-slate-400">
               Tip: Click the <Copy className="h-3 w-3 inline mx-0.5 text-slate-400" /> icons to copy details.
             </p>
             <Button onClick={() => setIsBankDetailsOpen(false)} className="px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm">
               Done
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
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
                <p>You haven't submitted any reports yet.</p>
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

function ClientReportDetailDialog({ report, onClose, onOpenChat }: { 
  report: ClientReport | null, 
  onClose: () => void, 
  onOpenChat: () => void 
}) {
  if (!report) return null;

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
          <DialogTitle className="text-xl mt-2">Report Details</DialogTitle>
        </DialogHeader>

        <div className="py-4">
           <div className="p-4 bg-slate-50 rounded-lg border text-foreground">
             "{report.description}"
           </div>
           
           <div className="mt-4">
             <h4 className="text-sm font-medium mb-2">Status</h4>
             <div className="flex items-center gap-2">
                <StatusBadge status={report.status} />
                <span className="text-sm text-muted-foreground">
                    {report.status === 'open' ? 'Your agent is reviewing this issue.' : 
                     report.status === 'resolved' ? 'This issue has been resolved.' : 'Update available.'}
                </span>
             </div>
           </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button className="flex-1" onClick={handleChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuss in Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}