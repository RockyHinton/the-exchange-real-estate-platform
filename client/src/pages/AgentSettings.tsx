import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Pencil, X, Check, Copy, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CURRENT_AGENT, BANK_DETAILS } from "@/lib/mockData";

interface UserDetails {
  avatar: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
}

interface AgencyDetails {
  name: string;
  address: string;
  city: string;
  postcode: string;
  email: string;
  phone: string;
}

export default function AgentSettings() {
  // User Details State
  const [userDetails, setUserDetails] = useState<UserDetails>({
    avatar: CURRENT_AGENT.avatar || "",
    fullName: CURRENT_AGENT.name,
    jobTitle: "Senior Estate Agent",
    email: "james.sterling@slatestone.co.uk",
    phone: "+44 20 7123 4567",
  });
  const [editingUser, setEditingUser] = useState(false);
  const [userDraft, setUserDraft] = useState<UserDetails>(userDetails);

  // Agency Details State
  const [agencyDetails, setAgencyDetails] = useState<AgencyDetails>({
    name: "Slate & Stone Properties",
    address: "45 Kensington High Street",
    city: "London",
    postcode: "W8 5ED",
    email: "hello@slatestone.co.uk",
    phone: "+44 20 7946 0958",
  });
  const [editingAgency, setEditingAgency] = useState(false);
  const [agencyDraft, setAgencyDraft] = useState<AgencyDetails>(agencyDetails);

  // User Details Handlers
  const handleEditUser = () => {
    setUserDraft({ ...userDetails });
    setEditingUser(true);
  };

  const handleSaveUser = () => {
    setUserDetails({ ...userDraft });
    setEditingUser(false);
    toast({ title: "Profile updated", description: "Your details have been saved." });
  };

  const handleCancelUser = () => {
    setUserDraft({ ...userDetails });
    setEditingUser(false);
  };

  // Agency Details Handlers
  const handleEditAgency = () => {
    setAgencyDraft({ ...agencyDetails });
    setEditingAgency(true);
  };

  const handleSaveAgency = () => {
    setAgencyDetails({ ...agencyDraft });
    setEditingAgency(false);
    toast({ title: "Agency details updated", description: "Company information has been saved." });
  };

  const handleCancelAgency = () => {
    setAgencyDraft({ ...agencyDetails });
    setEditingAgency(false);
  };

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and company information</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Details Card */}
          <Card className="bg-white border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">User Details</CardTitle>
                <CardDescription>Your personal profile information</CardDescription>
              </div>
              {!editingUser && (
                <Button variant="outline" size="sm" onClick={handleEditUser}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={editingUser ? userDraft.avatar : userDetails.avatar} />
                    <AvatarFallback className="text-lg font-serif">
                      {(editingUser ? userDraft.fullName : userDetails.fullName).split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {editingUser && (
                    <button 
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toast({ title: "Photo upload", description: "Photo upload would be handled here." })}
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{userDetails.fullName}</p>
                  <p className="text-sm text-muted-foreground">{userDetails.jobTitle}</p>
                </div>
              </div>

              <Separator />

              {/* User Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {editingUser ? (
                    <Input
                      id="fullName"
                      value={userDraft.fullName}
                      onChange={(e) => setUserDraft({ ...userDraft, fullName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{userDetails.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  {editingUser ? (
                    <Input
                      id="jobTitle"
                      value={userDraft.jobTitle}
                      onChange={(e) => setUserDraft({ ...userDraft, jobTitle: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{userDetails.jobTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {editingUser ? (
                    <Input
                      id="email"
                      type="email"
                      value={userDraft.email}
                      onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{userDetails.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {editingUser ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={userDraft.phone}
                      onChange={(e) => setUserDraft({ ...userDraft, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{userDetails.phone}</p>
                  )}
                </div>
              </div>

              {/* User Edit Actions */}
              {editingUser && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleCancelUser}>
                    <X className="h-4 w-4 mr-1.5" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser}>
                    <Check className="h-4 w-4 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agency Details Card */}
          <Card className="bg-white border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">Agency Details</CardTitle>
                <CardDescription>Your company information</CardDescription>
              </div>
              {!editingAgency && (
                <Button variant="outline" size="sm" onClick={handleEditAgency}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  {editingAgency ? (
                    <Input
                      id="agencyName"
                      value={agencyDraft.name}
                      onChange={(e) => setAgencyDraft({ ...agencyDraft, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{agencyDetails.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyAddress">Office Address</Label>
                  {editingAgency ? (
                    <Input
                      id="agencyAddress"
                      value={agencyDraft.address}
                      onChange={(e) => setAgencyDraft({ ...agencyDraft, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{agencyDetails.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencyCity">City / Region</Label>
                    {editingAgency ? (
                      <Input
                        id="agencyCity"
                        value={agencyDraft.city}
                        onChange={(e) => setAgencyDraft({ ...agencyDraft, city: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-foreground py-2">{agencyDetails.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyPostcode">Postcode</Label>
                    {editingAgency ? (
                      <Input
                        id="agencyPostcode"
                        value={agencyDraft.postcode}
                        onChange={(e) => setAgencyDraft({ ...agencyDraft, postcode: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-foreground py-2">{agencyDetails.postcode}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyEmail">Contact Email</Label>
                  {editingAgency ? (
                    <Input
                      id="agencyEmail"
                      type="email"
                      value={agencyDraft.email}
                      onChange={(e) => setAgencyDraft({ ...agencyDraft, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{agencyDetails.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agencyPhone">Contact Phone</Label>
                  {editingAgency ? (
                    <Input
                      id="agencyPhone"
                      type="tel"
                      value={agencyDraft.phone}
                      onChange={(e) => setAgencyDraft({ ...agencyDraft, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-foreground py-2">{agencyDetails.phone}</p>
                  )}
                </div>
              </div>

              {/* Agency Edit Actions */}
              {editingAgency && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={handleCancelAgency}>
                    <X className="h-4 w-4 mr-1.5" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAgency}>
                    <Check className="h-4 w-4 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Details Card (Read Only) */}
          <Card className="bg-white border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">Bank Details</CardTitle>
                <CardDescription>Company account information for receiving payments</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const text = `Account Name: ${BANK_DETAILS.accountName}\nBank: ${BANK_DETAILS.bankName}\nSort Code: ${BANK_DETAILS.sortCode}\nAccount Number: ${BANK_DETAILS.accountNumber}\nIBAN: ${BANK_DETAILS.iban}\nBIC: ${BANK_DETAILS.bic}`;
                  navigator.clipboard.writeText(text);
                  toast({ title: "Copied to clipboard", description: "All bank details copied." });
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Account Name */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Name</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-lg">{BANK_DETAILS.accountName}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.accountName);
                         toast({ title: "Copied", description: "Account Name copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>

                 {/* Bank Name */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">Bank Name</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-lg">{BANK_DETAILS.bankName}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.bankName);
                         toast({ title: "Copied", description: "Bank Name copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>

                 {/* Sort Code */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">Sort Code</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-lg font-mono">{BANK_DETAILS.sortCode}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.sortCode);
                         toast({ title: "Copied", description: "Sort Code copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>

                 {/* Account Number */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">Account Number</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-lg font-mono">{BANK_DETAILS.accountNumber}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
                         toast({ title: "Copied", description: "Account Number copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>

                 {/* IBAN */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">IBAN</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-base font-mono truncate" title={BANK_DETAILS.iban}>{BANK_DETAILS.iban}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.iban);
                         toast({ title: "Copied", description: "IBAN copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>

                 {/* BIC */}
                 <div className="space-y-1">
                   <Label className="text-muted-foreground text-xs uppercase tracking-wider">BIC / SWIFT</Label>
                   <div className="flex items-center gap-2 group">
                     <p className="font-medium text-lg font-mono">{BANK_DETAILS.bic}</p>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => {
                         navigator.clipboard.writeText(BANK_DETAILS.bic);
                         toast({ title: "Copied", description: "BIC copied to clipboard." });
                       }}
                     >
                       <Copy className="h-3 w-3 text-muted-foreground" />
                     </Button>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
