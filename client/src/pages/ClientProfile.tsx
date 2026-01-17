import Layout from "@/components/Layout";
import { MOCK_CLIENTS } from "@/lib/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, Phone, MapPin, Calendar, Building, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClientProfile() {
  const CURRENT_CLIENT = MOCK_CLIENTS[0];

  return (
    <Layout userType="client">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">View your personal information and account details</p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-medium">Read Only Access</AlertTitle>
          <AlertDescription className="text-blue-700">
            This profile information is managed by your real estate agent. If you need to update your contact details, change your email address, or correct any information, please contact your agent directly.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your registered account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start pb-6 border-b">
                <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                  <AvatarImage src={CURRENT_CLIENT.avatar} />
                  <AvatarFallback className="text-xl bg-slate-100">{CURRENT_CLIENT.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold">{CURRENT_CLIENT.name}</h3>
                  <div className="flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    <span>Client Account</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Building className="h-4 w-4 mr-2" />
                    <span>Tenant ID: #{CURRENT_CLIENT.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium">
                    {CURRENT_CLIENT.name}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {CURRENT_CLIENT.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {CURRENT_CLIENT.phone}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Account Created</Label>
                  <div className="p-3 bg-slate-50 rounded-md border text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    October 15, 2023
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats / Info Side Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Identity Verified</span>
                <span className="text-sm font-medium">Yes</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Lease Agreements</span>
                <span className="text-sm font-medium">1 Active</span>
              </div>
              
              <div className="mt-6 pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your identity and contact information were verified during the onboarding process. 
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
