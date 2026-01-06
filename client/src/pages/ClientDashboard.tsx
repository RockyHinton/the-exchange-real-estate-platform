import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, MOCK_CLIENTS, CURRENT_AGENT } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { ArrowRight, Upload, FileCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientDashboard() {
  // Mock client view - assume logged in as client 1 and looking at property 1
  const property = MOCK_PROPERTIES[0];
  const client = MOCK_CLIENTS[0];
  
  const approvedDocs = property.documents.filter(d => d.status === 'approved').length;
  const totalDocs = property.documents.length;
  const progress = (approvedDocs / totalDocs) * 100;
  
  const nextAction = property.documents.find(d => d.status === 'pending' || d.status === 'rejected');

  return (
    <Layout userType="client">
      <div className="space-y-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">Welcome, {client.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground mt-2">Here is the status of your property transaction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Property Card */}
            <div className="md:col-span-2">
              <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                <CardContent className="p-8 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-serif font-bold">{property.address}</h2>
                      <p className="text-primary-foreground/80">{property.city}, {property.zip}</p>
                    </div>
                    <StatusBadge status={property.stage} className="bg-white/10 text-white border-white/20 hover:bg-white/20" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Document Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/20 [&>div]:bg-white" />
                    <p className="text-xs text-primary-foreground/70">
                      {approvedDocs} of {totalDocs} documents approved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Action Card */}
            <Card className="bg-white border-border/60 shadow-sm border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Next Step</CardTitle>
              </CardHeader>
              <CardContent>
                 {nextAction ? (
                   <div className="space-y-4">
                     <div>
                       <p className="font-medium text-foreground">{nextAction.name}</p>
                       <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{nextAction.description}</p>
                     </div>
                     <Link href="/client/upload">
                       <Button className="w-full gap-2 shadow-sm">
                         Upload Now <ArrowRight className="h-4 w-4" />
                       </Button>
                     </Link>
                   </div>
                 ) : (
                   <div className="text-center py-4">
                     <FileCheck className="h-10 w-10 text-green-500 mx-auto mb-2" />
                     <p className="font-medium">All caught up!</p>
                     <p className="text-sm text-muted-foreground">Waiting for agent review.</p>
                   </div>
                 )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats / Timeline placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif">My Agent</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                 <Avatar className="h-14 w-14 border border-border">
                    <AvatarImage src={CURRENT_AGENT.avatar} />
                    <AvatarFallback>AG</AvatarFallback>
                 </Avatar>
                 <div>
                    <p className="font-medium text-foreground">{CURRENT_AGENT.name}</p>
                    <p className="text-sm text-muted-foreground">Senior Property Agent</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">Email</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Call</Button>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[160px] text-center p-6">
                 <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                   <Upload className="h-6 w-6 text-muted-foreground" />
                 </div>
                 <p className="font-medium text-foreground">Have extra documents?</p>
                 <p className="text-sm text-muted-foreground mb-3">Upload additional files to the vault.</p>
                 <Link href="/client/upload">
                   <Button variant="outline" size="sm">Go to Uploads</Button>
                 </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
