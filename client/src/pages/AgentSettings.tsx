import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Pencil, X, Check, Copy, Link2, Loader2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ManageHelpLinksModal } from "@/components/ManageHelpLinksModal";

interface BankDetails {
  accountName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
}

interface AgencyConfig {
  name: string;
  tagline: string;
  address: string;
  city: string;
  postcode: string;
  email: string;
  phone: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  jobTitle: string | null;
  role: string;
}

interface UserDraft {
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
}

export default function AgentSettings() {
  const queryClient = useQueryClient();

  // Fetch current user from API
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  // Fetch agency config from API
  const { data: agencyConfig, isLoading: agencyLoading } = useQuery<AgencyConfig>({
    queryKey: ["/api/config/agency"],
    queryFn: async () => {
      const res = await fetch("/api/config/agency", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch agency config");
      return res.json();
    },
  });

  // Fetch bank details from API
  const { data: bankDetails, isLoading: bankLoading } = useQuery<BankDetails>({
    queryKey: ["/api/config/bank"],
    queryFn: async () => {
      const res = await fetch("/api/config/bank", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bank details");
      return res.json();
    },
  });

  // User profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserDraft) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated", description: "Your details have been saved." });
      setEditingUser(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  // User Details State
  const [editingUser, setEditingUser] = useState(false);
  const [userDraft, setUserDraft] = useState<UserDraft>({
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
  });

  // Update draft when user data loads
  useEffect(() => {
    if (currentUser) {
      setUserDraft({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        phone: currentUser.phone || "",
        jobTitle: currentUser.jobTitle || "",
      });
    }
  }, [currentUser]);

  // Help Links Modal State
  const [helpLinksModalOpen, setHelpLinksModalOpen] = useState(false);

  // User Details Handlers
  const handleEditUser = () => {
    if (currentUser) {
      setUserDraft({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        phone: currentUser.phone || "",
        jobTitle: currentUser.jobTitle || "",
      });
    }
    setEditingUser(true);
  };

  const handleSaveUser = () => {
    updateProfileMutation.mutate(userDraft);
  };

  const handleCancelUser = () => {
    if (currentUser) {
      setUserDraft({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        phone: currentUser.phone || "",
        jobTitle: currentUser.jobTitle || "",
      });
    }
    setEditingUser(false);
  };

  // Helper to get display name
  const getDisplayName = () => {
    if (currentUser?.firstName || currentUser?.lastName) {
      return `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    }
    return "";
  };

  // Helper to get initials
  const getInitials = () => {
    const name = getDisplayName();
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase();
    }
    return currentUser?.email?.[0]?.toUpperCase() || "?";
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !currentUser?.firstName || !currentUser?.lastName || !currentUser?.phone || !currentUser?.jobTitle;

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
                <Button variant="outline" size="sm" onClick={handleEditUser} data-testid="button-edit-user">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {userLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Profile incomplete notice */}
                  {isProfileIncomplete && !editingUser && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800" data-testid="notice-profile-incomplete">
                      Complete your profile to help clients identify you.
                    </div>
                  )}

                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src={currentUser?.profileImageUrl || undefined} />
                        <AvatarFallback className="text-lg font-serif">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {editingUser && (
                        <button
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toast({ title: "Photo upload", description: "Photo upload would be handled here." })}
                          data-testid="button-upload-avatar"
                        >
                          <Camera className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid="text-display-name">
                        {getDisplayName() || <span className="text-muted-foreground italic">Add your name</span>}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="text-display-job-title">
                        {currentUser?.jobTitle || <span className="italic">Add your job title</span>}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* User Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {editingUser ? (
                          <Input
                            id="firstName"
                            value={userDraft.firstName}
                            onChange={(e) => setUserDraft({ ...userDraft, firstName: e.target.value })}
                            placeholder="Enter first name"
                            data-testid="input-first-name"
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2" data-testid="text-first-name">
                            {currentUser?.firstName || <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {editingUser ? (
                          <Input
                            id="lastName"
                            value={userDraft.lastName}
                            onChange={(e) => setUserDraft({ ...userDraft, lastName: e.target.value })}
                            placeholder="Enter last name"
                            data-testid="input-last-name"
                          />
                        ) : (
                          <p className="text-sm text-foreground py-2" data-testid="text-last-name">
                            {currentUser?.lastName || <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      {editingUser ? (
                        <Input
                          id="jobTitle"
                          value={userDraft.jobTitle}
                          onChange={(e) => setUserDraft({ ...userDraft, jobTitle: e.target.value })}
                          placeholder="e.g. Senior Estate Agent"
                          data-testid="input-job-title"
                        />
                      ) : (
                        <p className="text-sm text-foreground py-2" data-testid="text-job-title">
                          {currentUser?.jobTitle || <span className="text-muted-foreground italic">Not set</span>}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <p className="text-sm text-foreground py-2 flex items-center gap-2" data-testid="text-email">
                        {currentUser?.email}
                        <span className="text-xs text-muted-foreground">(from login)</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {editingUser ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={userDraft.phone}
                          onChange={(e) => setUserDraft({ ...userDraft, phone: e.target.value })}
                          placeholder="Enter phone number"
                          data-testid="input-phone"
                        />
                      ) : (
                        <p className="text-sm text-foreground py-2" data-testid="text-phone">
                          {currentUser?.phone || <span className="text-muted-foreground italic">Not set</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* User Edit Actions */}
                  {editingUser && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={handleCancelUser} data-testid="button-cancel-user">
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveUser} 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-user"
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1.5" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Agency Details Card (Read-Only) */}
          <Card className="bg-white border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-serif">Agency Details</CardTitle>
                  <CardDescription>Your company information</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Lock className="h-3 w-3" />
                  Configured by admin
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agencyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !agencyConfig?.name ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Agency details not configured. Set AGENCY_* environment variables.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Agency Name</span>
                    <span className="font-medium text-sm" data-testid="text-agency-name">{agencyConfig.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <span className="font-medium text-sm text-right" data-testid="text-agency-address">{agencyConfig.address}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">City</span>
                    <span className="font-medium text-sm" data-testid="text-agency-city">{agencyConfig.city}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Postcode</span>
                    <span className="font-medium text-sm" data-testid="text-agency-postcode">{agencyConfig.postcode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium text-sm" data-testid="text-agency-email">{agencyConfig.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="font-medium text-sm" data-testid="text-agency-phone">{agencyConfig.phone}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Details Card (Read Only) */}
          <Card className="bg-white border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif">Bank Details</CardTitle>
                <CardDescription>Account for receiving payments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Lock className="h-3 w-3" />
                  Configured by admin
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!bankDetails}
                  onClick={() => {
                    if (!bankDetails) return;
                    const text = `Account Name: ${bankDetails.accountName}\nBank: ${bankDetails.bankName}\nSort Code: ${bankDetails.sortCode}\nAccount Number: ${bankDetails.accountNumber}`;
                    navigator.clipboard.writeText(text);
                    toast({ title: "Copied to clipboard", description: "Bank details copied." });
                  }}
                  data-testid="button-copy-bank"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bankLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !bankDetails?.accountName ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Bank details not configured. Set BANK_* environment variables.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <span className="font-medium text-sm" data-testid="text-bank-account-name">{bankDetails.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Bank</span>
                    <span className="font-medium text-sm" data-testid="text-bank-name">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-sm text-muted-foreground">Sort Code</span>
                    <span className="font-medium text-sm font-mono" data-testid="text-bank-sort-code">{bankDetails.sortCode}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Account Number</span>
                    <span className="font-medium text-sm font-mono" data-testid="text-bank-account-number">{bankDetails.accountNumber}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manage Help Links Card */}
          <Card className="bg-white border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Help Links</CardTitle>
              <CardDescription>Manage service provider links for your clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure trusted service providers that your clients can access for internet, cleaning, utilities, and more.
              </p>
              <Button onClick={() => setHelpLinksModalOpen(true)} className="w-full" data-testid="button-manage-help-links">
                <Link2 className="h-4 w-4 mr-2" />
                Manage Help Links
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ManageHelpLinksModal
        open={helpLinksModalOpen}
        onOpenChange={setHelpLinksModalOpen}
      />
    </Layout>
  );
}
