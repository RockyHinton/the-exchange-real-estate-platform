import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AgentDashboard from "@/pages/AgentDashboard";
import PropertyOverview from "@/pages/PropertyOverview";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientUpload from "@/pages/ClientUpload";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Agent Routes */}
      <Route path="/agent" component={AgentDashboard} />
      <Route path="/agent/property/:id" component={PropertyOverview} />
      <Route path="/agent/properties" component={AgentDashboard} /> {/* Reuse for mockup */}
      <Route path="/agent/clients" component={AgentDashboard} /> {/* Reuse for mockup */}
      <Route path="/agent/documents" component={AgentDashboard} /> {/* Reuse for mockup */}

      {/* Client Routes */}
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/upload" component={ClientUpload} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
