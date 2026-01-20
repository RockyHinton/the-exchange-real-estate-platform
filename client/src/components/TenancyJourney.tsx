import { motion } from "framer-motion";
import { Check, Clock, Lock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Document, Property } from "@/lib/mockData";

export interface JourneyStage {
  id: string;
  title: string;
  description?: string;
  requirementIds: string[];
}

interface TenancyJourneyProps {
  stages: JourneyStage[];
  property: Property;
  className?: string;
  forceComplete?: boolean;
}

export function TenancyJourney({ stages, property, className, forceComplete = false }: TenancyJourneyProps) {
  // Compute stage status
  const getStageStatus = (stage: JourneyStage, index: number, allStages: JourneyStage[]) => {
    if (forceComplete) return { status: 'complete', isCurrent: false };

    // Check if all requirements for this stage are approved
    const requirements = property.documents.filter(doc => stage.requirementIds.includes(doc.id));
    const isComplete = requirements.length > 0 && requirements.every(doc => doc.status === 'approved');

    // Check if this is the current stage
    // Current stage is the first one that is NOT complete
    const firstIncompleteIndex = allStages.findIndex(s => {
      const sReqs = property.documents.filter(doc => s.requirementIds.includes(doc.id));
      // If no requirements, we assume it's incomplete if previous stages are complete (or it's the first one)
      // For this specific logic: empty requirements = always complete? 
      // Let's assume empty requirements means it's a manual stage or placeholder. 
      // To keep it simple: It's complete if requirements > 0 and all approved.
      // If requirements == 0, let's treat it as incomplete for now to show it as a step?
      // Actually, let's stick to the prompt: "A stage is COMPLETE when all its linked requirementIds are in an “Approved” state."
      // If linked requirementIds is empty, every() returns true. So it would be complete.
      // So for "Payments", we need a dummy ID if we want it to be incomplete.
      return !(sReqs.length > 0 && sReqs.every(doc => doc.status === 'approved'));
    });

    const isCurrent = index === firstIncompleteIndex;
    const isUpcoming = index > firstIncompleteIndex;

    // Special case: if all stages are complete
    if (firstIncompleteIndex === -1) {
        return { status: 'complete', isCurrent: false };
    }

    if (isComplete) return { status: 'complete', isCurrent: false };
    if (isCurrent) return { status: 'current', isCurrent: true };
    return { status: 'upcoming', isCurrent: false };
  };

  const currentStageIndex = forceComplete ? -1 : stages.findIndex((s, i) => getStageStatus(s, i, stages).isCurrent);
  const currentStage = currentStageIndex !== -1 ? stages[currentStageIndex] : stages[stages.length - 1]; // Fallback if all complete
  const isAllComplete = forceComplete || currentStageIndex === -1;

  // Calculate stats for current stage
  const currentStageReqs = property.documents.filter(doc => currentStage.requirementIds.includes(doc.id));
  const remainingReqs = currentStageReqs.filter(doc => doc.status !== 'approved').length;

  return (
    <Card className={cn("bg-white border-border/60 shadow-sm overflow-hidden", className)}>
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium tracking-wide uppercase">{property.address}, {property.city}</span>
            </div>
            <h2 className="text-3xl font-serif font-medium text-foreground">
              {isAllComplete ? "Journey Complete" : currentStage.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              {isAllComplete 
                ? "You're all set! Move-in date confirmed."
                : currentStage.description || `Stage ${currentStageIndex + 1} of ${stages.length}`
              }
            </p>
          </div>
          
          {!isAllComplete && (
            <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-200 flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-700">
                {remainingReqs} requirement{remainingReqs !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>

        {/* Journey Visualization */}
        <div className="relative mx-2">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
          
          {/* Progress Line */}
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 origin-left rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isAllComplete ? 1 : (currentStageIndex / (stages.length - 1)) }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          <div className="relative z-10 flex justify-between items-center w-full">
            {stages.map((stage, index) => {
              const { status, isCurrent } = getStageStatus(stage, index, stages);
              
              return (
                <div key={stage.id} className="flex flex-col items-center gap-4 relative group">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: status === 'complete' || status === 'current' ? 'var(--primary)' : '#e2e8f0', // slate-200 for better visibility
                      borderColor: status === 'current' ? 'var(--primary)' : 'transparent',
                    }}
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white",
                      status === 'upcoming' && "bg-slate-200" // Darker default
                    )}
                  >
                    {status === 'complete' && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                    {status === 'current' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </motion.div>
                  
                  {/* Stage Label */}
                  <div className={cn(
                    "absolute top-10 text-xs font-medium whitespace-nowrap transition-colors duration-300",
                    status === 'complete' ? "text-muted-foreground" : 
                    status === 'current' ? "text-foreground font-semibold text-sm" : "text-slate-400"
                  )}>
                    {stage.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
