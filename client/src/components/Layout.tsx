import { 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Menu,
  FileText,
  X
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CURRENT_AGENT, MOCK_CLIENTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
  userType: 'agent' | 'client';
}

export default function Layout({ children, userType }: LayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initialize from localStorage if available, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    // Persist to localStorage whenever state changes
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Agent nav
  const agentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/agent" },
    { icon: FileText, label: "Document Library", href: "/agent/documents" },
    { icon: Settings, label: "Settings", href: "/agent/settings" },
  ];

  // Client nav - Kept as is for now, or could simplify too if requested (instructions focused on agent)
  const clientNavItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/client" },
    { icon: FileText, label: "My Documents", href: "/client/upload" },
  ];

  const navItems = userType === 'agent' ? agentNavItems : clientNavItems;
  const user = userType === 'agent' ? CURRENT_AGENT : MOCK_CLIENTS[0];

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border hidden md:flex flex-col text-sidebar-foreground transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className={cn("p-4 border-b border-sidebar-border/10 flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
          {isSidebarOpen ? (
             <div className="overflow-hidden whitespace-nowrap">
               <h1 className="font-serif text-xl font-bold tracking-tight">The Exchange.</h1>
               <p className="text-[10px] text-sidebar-foreground/60 mt-0.5 uppercase tracking-widest">Property Management</p>
             </div>
          ) : (
            <div className="font-serif font-bold text-xl tracking-tight">E.</div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const content = (
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                !isSidebarOpen && "justify-center px-2"
              )}>
                <item.icon className="h-5 w-5 shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </div>
            );

            return (
              <Link key={item.href} href={item.href}>
                {isSidebarOpen ? (
                  content
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t border-sidebar-border/10 space-y-4", !isSidebarOpen && "items-center flex flex-col p-2")}>
           {userType === 'client' ? (
             <Link href="/client/profile">
               <div className={cn("flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent/50 p-2 -m-2 rounded-md transition-colors", isSidebarOpen ? "px-3" : "px-0 justify-center")}>
                  <Avatar className="h-9 w-9 border border-sidebar-foreground/10 shrink-0">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{user.name.substring(0,2)}</AvatarFallback>
                  </Avatar>
                  
                  {isSidebarOpen && (
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">Client Profile</p>
                    </div>
                  )}
               </div>
             </Link>
           ) : (
             <div className={cn("flex items-center gap-3", isSidebarOpen ? "px-3" : "px-0 justify-center")}>
                <Avatar className="h-9 w-9 border border-sidebar-foreground/10 shrink-0">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{user.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                
                {isSidebarOpen && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">Senior Agent</p>
                  </div>
                )}
             </div>
           )}
           
           <Link href="/">
             {isSidebarOpen ? (
                <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-9">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
             ) : (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-9 w-9">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
             )}
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Mobile Header */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-20">
           <div className="flex items-center gap-4">
             {/* Toggle Button (Desktop & Mobile) */}
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
             </Button>
             
             {/* Mobile Logo */}
             <span className="md:hidden font-serif font-bold text-lg">The Exchange.</span>
           </div>

           <div className="md:hidden">
             <Button variant="ghost" size="icon">
               <Menu className="h-5 w-5" />
             </Button>
           </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50/50">
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
