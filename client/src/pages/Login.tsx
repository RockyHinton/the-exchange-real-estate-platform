import { Button } from "@/components/ui/button";
import loginHouseHighRes from "@assets/generated_images/minimalist_modern_glass_house_architecture_model_high_resolution.png";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "agent") {
        setLocation("/agent");
      } else if (user.role === "client") {
        setLocation("/client");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="h-screen w-full bg-white flex overflow-hidden font-sans text-slate-900 selection:bg-slate-100">
      
      {/* Left Column: Content */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 md:px-20 lg:px-24 xl:px-32 z-10 bg-white">
        
        <div className="max-w-md w-full animate-in fade-in slide-in-from-left-4 duration-700">
          {/* Header Typography matching the slide */}
          <div className="mb-12">
            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">
              Property Management
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
              The Exchange
            </h1>
            <p className="text-slate-500 text-lg font-light leading-relaxed max-w-sm">
              A modern property management system for independent estate agents
            </p>
          </div>

          {/* Login Options - Integrated into the minimalist aesthetic */}
          <div className="space-y-5">
            
            {/* Google Button - Primary */}
            <Button 
              variant="outline" 
              className="w-full h-14 bg-white border-slate-200 hover:border-slate-800 hover:bg-slate-50 transition-all duration-300 rounded-none text-slate-600 font-medium text-base group justify-start px-6"
              onClick={handleLogin}
              data-testid="button-google-login"
            >
              <div className="mr-4 flex items-center justify-center">
                <svg className="w-5 h-5 transition-all duration-300 group-hover:scale-110" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              Continue with Google
            </Button>

            <p className="text-xs text-slate-400 text-center mt-4">
              Only registered users can access the system. Contact your estate agent if you need access.
            </p>
          </div>

        </div>
      </div>

      {/* Right Column: Immersive Background */}
      <div 
        className="hidden lg:block flex-1 relative h-full bg-white"
        style={{
          backgroundImage: `url(${loginHouseHighRes})`,
          backgroundSize: '125%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased'
        }}
      >
        {/* Gradient Overlays for Seamless Blending */}
        
        {/* Left Fade: Fades the left edge of the image into the white left panel/gap */}
        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none" />
        
        {/* Bottom Fade: Fades the bottom of the house into white */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        
        {/* Top Fade: Ensures seamless blend at the top */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none" />
      </div>

    </div>
  );
}
