import { useState } from "react";
import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS, CURRENT_AGENT } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
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
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Mock rent schedule (would come from agent in real app)
const MOCK_RENT_SCHEDULE = [
  { id: "pay_1", dueDate: "2026-10-01", amount: 1200, paid: true },
  { id: "pay_2", dueDate: "2026-11-01", amount: 1200, paid: true },
  { id: "pay_3", dueDate: "2026-12-01", amount: 1200, paid: false },
  { id: "pay_4", dueDate: "2027-01-01", amount: 1200, paid: false },
  { id: "pay_5", dueDate: "2027-02-01", amount: 1200, paid: false },
];

export default function ClientDashboard() {
  const property = MOCK_PROPERTIES[0];
  const client = MOCK_CLIENTS[0];
  
  // Toggle to demo both states (in real app this would be based on property.stage)
  const [isComplete, setIsComplete] = useState(false);
  
  const approvedDocs = property.documents.filter(d => d.status === 'approved').length;
  const totalDocs = property.documents.length;
  const progress = isComplete ? 100 : (approvedDocs / totalDocs) * 100;
  
  const pendingDocs = property.documents.filter(d => d.status === 'pending' || d.status === 'rejected');
  const completedDocs = property.documents.filter(d => d.status === 'approved' || d.status === 'in_review');

  // Rent schedule for complete state
  const upcomingPayments = MOCK_RENT_SCHEDULE.filter(p => !p.paid).slice(0, 3);
  const nextPayment = upcomingPayments[0];

  return (
    <Layout userType="client">
      <div className="min-h-[calc(100vh-8rem)]">
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
            
            {/* Demo Toggle - Remove in production */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsComplete(!isComplete)}
              className="self-start lg:self-auto text-xs"
            >
              Demo: {isComplete ? "Show In Progress" : "Show Complete"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Hero Card */}
            <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl pointer-events-none" />
              <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold">{property.address}</h2>
                      <div className="flex items-center gap-1.5 text-primary-foreground/70 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">{property.city}, {property.zip}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge 
                    status={isComplete ? "Approved" : property.stage} 
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0" 
                  />
                </div>
                
                {isComplete ? (
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg">
                    <PartyPopper className="h-8 w-8 text-white/80" />
                    <div>
                      <p className="font-medium">Congratulations!</p>
                      <p className="text-sm text-primary-foreground/70">Your move-in date is confirmed for 1st October 2026</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Document Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5 bg-white/20 [&>div]:bg-white" />
                    <p className="text-sm text-primary-foreground/70">
                      {approvedDocs} of {totalDocs} documents approved
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                    {MOCK_RENT_SCHEDULE.map((payment) => (
                      <div 
                        key={payment.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-colors",
                          payment.paid ? "bg-green-50/50" : "bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {payment.paid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-sm",
                            payment.paid ? "text-muted-foreground" : "text-foreground font-medium"
                          )}>
                            {format(new Date(payment.dueDate), "d MMM yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "font-medium tabular-nums",
                            payment.paid ? "text-muted-foreground" : "text-foreground"
                          )}>
                            £{payment.amount.toLocaleString()}
                          </span>
                          {payment.paid && (
                            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                              Paid
                            </span>
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
                    Upload the required documents to proceed with your application
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">
                  {property.documents.map((doc, index) => {
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
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Agent Contact Card - Always Visible */}
            <Card className="bg-white border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif">Your Agent</CardTitle>
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
            <Card className="bg-white border-border/60 shadow-sm">
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

            {/* Quick Help Card */}
            <Card className="bg-slate-50 border-border/60">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-1">Need help?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {isComplete 
                    ? "Questions about your tenancy? Get in touch with your agent."
                    : "Having trouble with your documents? Your agent is here to help."}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Mail className="h-3.5 w-3.5 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
