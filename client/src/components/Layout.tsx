import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut,
  Bell
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CURRENT_AGENT, MOCK_CLIENTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
  userType: 'agent' | 'client';
}

export default function Layout({ children, userType }: LayoutProps) {
  const [location] = useLocation();

  const agentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/agent" },
    { icon: Building2, label: "Properties", href: "/agent/properties" },
    { icon: Users, label: "Clients", href: "/agent/clients" },
    { icon: FileText, label: "Documents", href: "/agent/documents" },
  ];

  const clientNavItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/client" },
    { icon: FileText, label: "My Documents", href: "/client/upload" },
  ];

  const navItems = userType === 'agent' ? agentNavItems : clientNavItems;
  const user = userType === 'agent' ? CURRENT_AGENT : MOCK_CLIENTS[0];

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col text-sidebar-foreground">
        <div className="p-6 border-b border-sidebar-border/10">
          <h1 className="font-serif text-2xl font-bold tracking-tight">The Exchange.</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1 uppercase tracking-widest">Property Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/10 space-y-4">
           <div className="flex items-center gap-3 px-3">
              <Avatar className="h-9 w-9 border border-sidebar-foreground/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">{user.name.substring(0,2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{userType === 'agent' ? 'Senior Agent' : 'Client'}</p>
              </div>
           </div>
           
           <Link href="/">
             <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-9">
               <LogOut className="mr-2 h-4 w-4" />
               Sign Out
             </Button>
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (visible only on small screens) */}
        <header className="md:hidden h-16 border-b bg-sidebar text-sidebar-foreground flex items-center justify-between px-4">
          <span className="font-serif font-bold text-lg">The Exchange.</span>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
