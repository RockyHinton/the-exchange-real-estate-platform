import Layout from "@/components/Layout";
import { MOCK_PROPERTIES, CURRENT_AGENT } from "@/lib/mockData";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search, Filter, MapPin, Building, ChevronRight, PieChart } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AgentDashboard() {
  return (
    <Layout userType="agent">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {CURRENT_AGENT.name}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search properties..." className="pl-9 bg-white border-border/60" />
            </div>
            <Button variant="outline" className="gap-2 bg-white">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-primary-foreground/70 text-sm font-medium">Active Properties</p>
                  <h3 className="text-3xl font-serif font-bold mt-2">12</h3>
                </div>
                <div className="p-2 bg-primary-foreground/10 rounded-lg">
                  <Building className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-sm text-primary-foreground/60">
                +2 from last month
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending Review</p>
                  <h3 className="text-3xl font-serif font-bold mt-2 text-foreground">5</h3>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <PieChart className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Documents awaiting approval
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Clients Active</p>
                  <h3 className="text-3xl font-serif font-bold mt-2 text-foreground">8</h3>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <UsersIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Across all properties
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PROPERTIES.map((property) => {
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
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={property.stage} className="shadow-sm backdrop-blur-md bg-white/90" />
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-serif">{property.address}</CardTitle>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            {property.city}, {property.zip}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-4 flex-1">
                      <div className="flex items-center gap-3 mt-2 mb-6">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarImage src={property.client.avatar} />
                          <AvatarFallback>{property.client.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium text-foreground">{property.client.name}</p>
                          <p className="text-muted-foreground text-xs">Client</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Completion Progress</span>
                          <span className="text-primary">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {approvedDocs} of {totalDocs} documents approved
                        </p>
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
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
