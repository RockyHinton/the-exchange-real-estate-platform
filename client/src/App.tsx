import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AgentDashboard from "@/pages/AgentDashboard";
import PropertyOverview from "@/pages/PropertyOverview";
import AgentSettings from "@/pages/AgentSettings";
import DocumentLibrary from "@/pages/DocumentLibrary";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientUpload from "@/pages/ClientUpload";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Agent Routes */}
      <Route path="/agent" component={AgentDashboard} />
      <Route path="/agent/property/:id" component={PropertyOverview} />
      <Route path="/agent/documents" component={DocumentLibrary} />
      <Route path="/agent/settings" component={AgentSettings} />

      {/* Client Routes */}
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/upload" component={ClientUpload} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="the-exchange-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
