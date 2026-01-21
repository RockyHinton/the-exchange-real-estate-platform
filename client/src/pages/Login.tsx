import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShieldCheck, UserCircle2 } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* 
        ABSTRACT BACKGROUND 
        "Architectural light" feel using CSS gradients and blurs.
      */}
      <div className="absolute inset-0 z-0 bg-[#F8FAFC]">
        {/* Soft top-left glow (warm/neutral) */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-slate-200/50 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
        
        {/* Soft bottom-right glow (cool/slate) */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-slate-300/50 rounded-full blur-[100px] mix-blend-multiply opacity-60" />
        
        {/* Subtle center architectural beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-gradient-to-b from-white/80 via-transparent to-transparent opacity-40 blur-3xl pointer-events-none" />
        
        {/* Grain overlay for texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="w-full max-w-[420px] px-6 relative z-10">
        
        {/* 
           GLASS LOGIN PANEL 
           Layered effect with a back layer for depth.
        */}
        <div className="relative group">
          
          {/* Back glass layer (offset for depth) */}
          <div className="absolute inset-0 bg-white/40 rounded-3xl translate-x-3 translate-y-3 blur-[2px] border border-white/20" />
          
          {/* Main Panel */}
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05),0_4px_12px_-2px_rgba(0,0,0,0.02)] overflow-hidden p-8 sm:p-10">
            
            {/* Light Sweep Animation */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-light-sweep pointer-events-none" />
            
            {/* BRAND HEADER */}
            <div className="text-center mb-10 relative">
              <h1 className="font-serif text-3xl font-bold text-slate-800 tracking-tight mb-1">
                The Exchange.
              </h1>
              <div className="flex flex-col gap-0.5">
                 <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Premium Property Management</p>
                 <p className="text-[10px] text-slate-400/80 font-medium">Secure portal for clients and agents</p>
              </div>
            </div>

            {/* LOGIN OPTIONS */}
            <div className="space-y-6 relative">
              
              {/* Google Button */}
              <Button 
                variant="outline" 
                className="w-full h-14 bg-white border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl text-slate-600 font-medium text-base group/google"
              >
                <div className="mr-3 flex items-center justify-center transition-transform group-hover/google:scale-110">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200/60"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-semibold tracking-widest text-slate-400 uppercase bg-transparent">or</span>
                <div className="flex-grow border-t border-slate-200/60"></div>
              </div>

              {/* Role Cards (Client / Agent) */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/client" className="w-full">
                  <div className="group/card cursor-pointer bg-white/50 hover:bg-white border border-slate-200/60 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 rounded-xl p-4 transition-all duration-300 text-center h-full flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 group-hover/card:bg-primary/5 flex items-center justify-center mb-3 transition-colors">
                      <UserCircle2 className="w-5 h-5 text-slate-500 group-hover/card:text-primary transition-colors" />
                    </div>
                    <span className="block text-sm font-semibold text-slate-700 group-hover/card:text-primary mb-1">Client</span>
                    <span className="block text-[10px] text-slate-400 group-hover/card:text-slate-500">View client portal</span>
                  </div>
                </Link>

                <Link href="/agent" className="w-full">
                   <div className="group/card cursor-pointer bg-white/50 hover:bg-white border border-slate-200/60 hover:border-slate-800/20 hover:shadow-lg hover:-translate-y-0.5 rounded-xl p-4 transition-all duration-300 text-center h-full flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 group-hover/card:bg-slate-800/5 flex items-center justify-center mb-3 transition-colors">
                      <ShieldCheck className="w-5 h-5 text-slate-500 group-hover/card:text-slate-800 transition-colors" />
                    </div>
                    <span className="block text-sm font-semibold text-slate-700 group-hover/card:text-slate-800 mb-1">Agent</span>
                    <span className="block text-[10px] text-slate-400 group-hover/card:text-slate-500">View agent dashboard</span>
                  </div>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-8 text-slate-400/80 text-[11px] font-medium tracking-wider uppercase">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Help</a>
        </div>

      </div>
    </div>
  );
}
