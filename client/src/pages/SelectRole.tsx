import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, UserCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function SelectRole() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", "/api/user/role", { role });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome!", description: `You're now signed in as ${data.role === "agent" ? "an Agent" : "a Client"}.` });
      
      if (data.role === "agent") {
        setLocation("/agent");
      } else {
        setLocation("/client");
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to set your role. Please try again.", variant: "destructive" });
      setSelectedRole(null);
    }
  });

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setRoleMutation.mutate(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-lg bg-white border-slate-200 shadow-xl">
        <CardHeader className="text-center pb-2">
          <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">
            The Exchange
          </p>
          <CardTitle className="text-2xl font-serif">Welcome, {user?.firstName || "there"}!</CardTitle>
          <CardDescription className="text-base mt-2">
            How will you be using The Exchange?
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center gap-3 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-300 rounded-lg group"
              onClick={() => handleSelectRole("client")}
              disabled={setRoleMutation.isPending}
              data-testid="button-role-client"
            >
              {selectedRole === "client" && setRoleMutation.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : (
                <>
                  <UserCircle2 className="w-10 h-10 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  <div className="text-center">
                    <span className="block text-lg font-semibold text-slate-700 group-hover:text-slate-900">I'm a Client</span>
                    <span className="block text-xs text-slate-400 mt-1">Renting a property</span>
                  </div>
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              className="h-32 flex flex-col items-center justify-center gap-3 border-2 hover:border-slate-900 hover:bg-slate-50 transition-all duration-300 rounded-lg group"
              onClick={() => handleSelectRole("agent")}
              disabled={setRoleMutation.isPending}
              data-testid="button-role-agent"
            >
              {selectedRole === "agent" && setRoleMutation.isPending ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : (
                <>
                  <ShieldCheck className="w-10 h-10 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  <div className="text-center">
                    <span className="block text-lg font-semibold text-slate-700 group-hover:text-slate-900">I'm an Agent</span>
                    <span className="block text-xs text-slate-400 mt-1">Managing properties</span>
                  </div>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
