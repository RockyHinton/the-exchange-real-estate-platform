import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ShieldCheck, UserCircle2, Building2, Chrome } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] relative overflow-hidden">
      {/* High Quality Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-e25fa1108056?q=80&w=2574&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Abstract Background Decoration (Subtle on top of image) */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl z-0 mix-blend-overlay" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-accent/20 rounded-full blur-3xl z-0 mix-blend-overlay" />

      <div className="max-w-md w-full px-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md text-white mb-6 border border-white/20 shadow-2xl">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-white tracking-tight drop-shadow-lg">The Exchange.</h1>
          <p className="text-white/80 mt-3 text-lg font-light tracking-wide">Premium Property Management</p>
        </div>

        <Card className="border-white/20 shadow-2xl backdrop-blur-xl bg-white/90">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-serif text-center text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-center text-slate-500">
              Access your secure property portal
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-8 pb-8">
            
            {/* Google Login Button */}
            <Button variant="outline" className="w-full h-12 justify-center gap-3 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-slate-600 font-medium">
              <Chrome className="w-5 h-5" />
              Continue with Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-medium">
                <span className="bg-white/90 px-2 text-slate-400">Or continue as</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/client">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <UserCircle2 className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-primary">Client</div>
                  </div>
                </Button>
              </Link>

              <Link href="/agent">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 border-slate-200 hover:border-slate-800/50 hover:bg-slate-900/5 transition-all group relative overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 group-hover:text-slate-900">Agent</div>
                  </div>
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center gap-6 text-white/60 text-xs font-medium tracking-wider uppercase">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Help</a>
        </div>
      </div>
    </div>
  );
}
