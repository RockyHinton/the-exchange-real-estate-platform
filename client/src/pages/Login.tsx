import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ShieldCheck, UserCircle2, Building2 } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-200 to-transparent opacity-50 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full px-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">The Exchange.</h1>
          <p className="text-muted-foreground mt-2">Secure Property Document Management</p>
        </div>

        <Card className="border-border/50 shadow-soft backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-medium text-center">Select User Role</CardTitle>
            <CardDescription className="text-center">
              Choose a role to simulate the user experience
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/agent">
              <Button variant="outline" className="w-full h-16 justify-start px-4 border-muted hover:border-primary/30 hover:bg-slate-50 transition-all group">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Real Estate Agent</div>
                  <div className="text-xs text-muted-foreground">Manage properties & reviews</div>
                </div>
              </Button>
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Link href="/client">
              <Button variant="outline" className="w-full h-16 justify-start px-4 border-muted hover:border-primary/30 hover:bg-slate-50 transition-all group">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <UserCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Property Client</div>
                  <div className="text-xs text-muted-foreground">Upload & track documents</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; 2026 The Exchange. Protected Client Portal.
        </p>
      </div>
    </div>
  );
}
