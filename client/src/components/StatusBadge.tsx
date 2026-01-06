import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, FileText, XCircle } from "lucide-react";
import type { DocumentStatus } from "@/lib/mockData";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    pending: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
    in_review: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    awaiting: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  };
  
  const labels: Record<string, string> = {
    active: "Active",
    pending: "Missing",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Action Required",
    awaiting: "Awaiting",
  };

  const icons: Record<string, any> = {
    active: CheckCircle2,
    pending: AlertCircle,
    in_review: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    awaiting: Clock,
  };
  
  const normalizedStatus = status.toLowerCase().replace(' ', '_');
  const Icon = icons[normalizedStatus] || FileText;

  return (
    <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-0.5 font-medium transition-colors", styles[normalizedStatus as keyof typeof styles] || styles.pending, className)}>
      <Icon className="w-3.5 h-3.5" />
      {labels[normalizedStatus] || status}
    </Badge>
  );
}
