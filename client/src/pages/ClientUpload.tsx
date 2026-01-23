import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, FileCheck, ShieldCheck, FileIcon, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useClientProperties, useMyClientRecord, useMyChecklist, useUploadChecklistRequirement, type ClientChecklistRequirement } from "@/hooks/use-client-data";
import { FIXED_STAGES, type FixedStageId } from "@shared/schema";

const getStageName = (stageId: string): string => {
  const stage = FIXED_STAGES.find(s => s.id === stageId);
  return stage?.name || stageId;
};

export default function ClientUpload() {
  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useClientProperties();
  const property = properties?.[0];
  const propertyId = property?.id;
  
  const { data: myClientRecord, isLoading: clientRecordLoading } = useMyClientRecord(propertyId);
  const myClientId = myClientRecord?.id;
  
  const { data: checklist, isLoading: checklistLoading, error: checklistError } = useMyChecklist(propertyId, myClientId);
  
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [expandedStages, setExpandedStages] = useState<Set<FixedStageId>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadChecklistRequirement();

  const requirementsByStage = useMemo(() => {
    if (!checklist?.requirements) return {};
    const grouped: Record<FixedStageId, ClientChecklistRequirement[]> = {} as any;
    for (const stage of FIXED_STAGES) {
      grouped[stage.id] = checklist.requirements.filter(r => r.stageId === stage.id);
    }
    return grouped;
  }, [checklist?.requirements]);

  const allRequirements = checklist?.requirements || [];
  
  useEffect(() => {
    if (allRequirements.length > 0 && selectedReqId === null) {
      const firstActionable = allRequirements.find(r => r.status === 'pending' || r.status === 'rejected') || allRequirements[0];
      if (firstActionable) {
        setSelectedReqId(firstActionable.id);
      }
    }
  }, [allRequirements, selectedReqId]);

  const toggleStage = (stageId: FixedStageId) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedReqId && e.dataTransfer.files.length > 0) {
      handleUpload(selectedReqId, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedReqId) {
      handleUpload(selectedReqId, e.target.files[0]);
    }
  };

  const handleUpload = (reqId: string, file: File) => {
    setUploadProgress(prev => ({ ...prev, [reqId]: 10 }));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[reqId] || 0;
        if (current >= 80) {
          clearInterval(interval);
          uploadMutation.mutate(
            { requirementId: reqId, fileName: file.name },
            {
              onSuccess: () => {
                setUploadProgress(prev => ({ ...prev, [reqId]: 100 }));
                toast({
                  title: "Document Uploaded",
                  description: "Your file has been securely transmitted for review.",
                });
              },
              onError: () => {
                setUploadProgress(prev => ({ ...prev, [reqId]: 0 }));
                toast({
                  title: "Upload Failed",
                  description: "There was an error uploading your document. Please try again.",
                  variant: "destructive",
                });
              },
            }
          );
          return { ...prev, [reqId]: 90 };
        }
        return { ...prev, [reqId]: current + 15 };
      });
    }, 300);
  };

  const isLoading = propertiesLoading || clientRecordLoading || checklistLoading;
  const error = propertiesError || checklistError;

  if (isLoading) {
    return (
      <Layout userType="client">
        <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-slate-50/50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-slate-500">Loading your checklist...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout userType="client">
        <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-slate-50/50">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-slate-900">Unable to load documents</h2>
            <p className="text-slate-500 max-w-md">
              {error ? String(error) : "No property found. Please contact your agent."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!myClientId) {
    return (
      <Layout userType="client">
        <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-slate-50/50">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400" />
            <h2 className="text-xl font-semibold text-slate-900">Checklist not ready</h2>
            <p className="text-slate-500 max-w-md">
              Your document checklist is being set up. Please check back shortly.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedReq = allRequirements.find(r => r.id === selectedReqId);
  const completedCount = allRequirements.filter(r => r.status === 'approved').length;
  const totalCount = allRequirements.length;

  return (
    <Layout userType="client">
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50/50">
        
        <div className="w-full max-w-[420px] bg-white border-r border-slate-200/60 flex flex-col h-full shadow-sm z-10">
          <div className="px-8 py-8 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
               <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">My Documents</h1>
               <span className="text-xs font-medium text-slate-400 font-mono">
                  {completedCount} / {totalCount}
               </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Please upload the required documents to verify your tenancy application.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {FIXED_STAGES.map((stage) => {
               const stageReqs = requirementsByStage[stage.id] || [];
               if (stageReqs.length === 0) return null;
               
               const isExpanded = expandedStages.has(stage.id);
               const stageCompleted = stageReqs.every(r => r.status === 'approved');
               const stageApprovedCount = stageReqs.filter(r => r.status === 'approved').length;
               
               return (
                 <div key={stage.id} className="border border-slate-100 rounded-lg overflow-hidden">
                   <button
                     onClick={() => toggleStage(stage.id)}
                     className={cn(
                       "w-full flex items-center justify-between p-4 text-left transition-colors",
                       stageCompleted ? "bg-emerald-50/50" : "bg-slate-50/50 hover:bg-slate-100/50"
                     )}
                     data-testid={`stage-toggle-${stage.id}`}
                   >
                     <div className="flex items-center gap-3">
                       {isExpanded ? (
                         <ChevronDown className="h-4 w-4 text-slate-400" />
                       ) : (
                         <ChevronRight className="h-4 w-4 text-slate-400" />
                       )}
                       <span className={cn(
                         "font-medium text-sm",
                         stageCompleted ? "text-emerald-700" : "text-slate-700"
                       )}>
                         {stage.name}
                       </span>
                     </div>
                     <span className={cn(
                       "text-xs font-mono",
                       stageCompleted ? "text-emerald-600" : "text-slate-400"
                     )}>
                       {stageApprovedCount}/{stageReqs.length}
                     </span>
                   </button>
                   
                   {isExpanded && (
                     <div className="border-t border-slate-100">
                       {stageReqs.map((req) => {
                         const isSelected = selectedReqId === req.id;
                         const isApproved = req.status === 'approved';
                         const isUploaded = req.status === 'uploaded';
                         const isInReview = req.status === 'in_review';
                         
                         return (
                           <div 
                             key={req.id}
                             data-testid={`requirement-item-${req.id}`}
                             onClick={() => setSelectedReqId(req.id)}
                             className={cn(
                               "group relative p-4 cursor-pointer transition-all duration-200 border-b border-slate-50 last:border-b-0 select-none",
                               isSelected 
                                 ? "bg-slate-50" 
                                 : "bg-white hover:bg-slate-50/50",
                               isApproved && !isSelected && "opacity-60"
                             )}
                           >
                             {isSelected && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-slate-900 rounded-r-full" />
                             )}
                             
                             <div className="flex items-start gap-3 pl-2">
                               <div className={cn(
                                 "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors border",
                                 isApproved ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                 isSelected ? "bg-slate-900 text-white border-slate-900" : 
                                 "bg-white border-slate-100 text-slate-400"
                               )}>
                                  {isApproved ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                               </div>

                               <div className="flex-1 min-w-0">
                                 <h3 className={cn(
                                   "font-medium text-sm truncate", 
                                   isSelected ? "text-slate-900" : "text-slate-700"
                                 )}>
                                   {req.title}
                                 </h3>
                                 
                                 <span className={cn(
                                   "text-[10px] font-medium uppercase tracking-wider",
                                   isApproved ? "text-emerald-600" :
                                   isInReview || isUploaded ? "text-amber-600" :
                                   req.status === 'rejected' ? "text-red-600" :
                                   "text-slate-400"
                                 )}>
                                    {req.status.replace('_', ' ')}
                                 </span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               );
             })}
             
             <div className="h-12" />
          </div>
        </div>

        <div className="flex-1 h-full flex items-center justify-center p-12 bg-slate-50/50">
          
          {selectedReq ? (
            <div className="w-full max-w-3xl h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               <div className="mb-10 text-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                        "mb-4 px-3 py-1 text-xs uppercase tracking-widest bg-white shadow-sm font-medium",
                        selectedReq.status === 'approved' ? "text-emerald-600 border-emerald-200" : "text-slate-500 border-slate-200"
                    )}
                  >
                    {getStageName(selectedReq.stageId)}
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3">
                    {selectedReq.title}
                  </h2>
                  <p className="text-lg text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
                    {selectedReq.description || "Please upload the required document."}
                  </p>
               </div>

               <Card className="border-0 shadow-xl shadow-slate-200/60 bg-white rounded-2xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                 
                 <CardContent className="p-10 md:p-16">
                    {selectedReq.status === 'approved' ? (
                        <div className="flex flex-col items-center justify-center py-8">
                           <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <ShieldCheck className="h-10 w-10" />
                           </div>
                           <h3 className="text-xl font-medium text-slate-900 mb-2">Document Verified</h3>
                           <p className="text-slate-500 text-center max-w-sm">
                              This document has been reviewed and approved by your agent.
                           </p>
                        </div>
                    ) : uploadProgress[selectedReq.id] === 100 || selectedReq.status === 'in_review' || selectedReq.status === 'uploaded' ? (
                        <div className="flex flex-col items-center justify-center py-8">
                           <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <FileCheck className="h-10 w-10" />
                           </div>
                           <h3 className="text-xl font-medium text-slate-900 mb-2">Submission Received</h3>
                           <p className="text-slate-500 text-center max-w-sm">
                              Your document is currently being reviewed. We will notify you once approved.
                           </p>
                        </div>
                    ) : selectedReq.status === 'rejected' ? (
                        <div 
                          data-testid="upload-dropzone"
                          className={cn(
                            "group relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300",
                            "border-red-200 hover:border-red-300 bg-red-50/30 hover:bg-red-50/50",
                            "flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
                          )}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                           <div className="mb-6 p-4 bg-white rounded-full shadow-sm text-red-400 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300">
                              <AlertCircle className="h-8 w-8" />
                           </div>
                           <h3 className="text-lg font-medium text-slate-900 mb-2">
                              Document Rejected
                           </h3>
                           <p className="text-sm text-red-600 mb-4 max-w-xs mx-auto">
                              {selectedReq.rejectionReason || "Please upload a different document."}
                           </p>
                           <Button 
                             data-testid="button-reupload-file"
                             size="lg" 
                             className="bg-slate-900 text-white hover:bg-slate-800 px-8 rounded-full shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl"
                           >
                             Upload New File
                           </Button>
                           <input 
                             type="file" 
                             className="hidden" 
                             ref={fileInputRef}
                             onChange={handleFileSelect}
                             data-testid="input-file-upload"
                           />
                        </div>
                    ) : (
                        <div 
                          data-testid="upload-dropzone"
                          className={cn(
                            "group relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300",
                            "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50",
                            "flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
                          )}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                           {uploadProgress[selectedReq.id] > 0 && uploadProgress[selectedReq.id] < 100 ? (
                              <div className="w-full max-w-xs space-y-4">
                                 <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                   <span>Encrypting & Uploading...</span>
                                   <span>{uploadProgress[selectedReq.id]}%</span>
                                 </div>
                                 <Progress value={uploadProgress[selectedReq.id]} className="h-1.5 bg-slate-100 [&>div]:bg-slate-800" />
                              </div>
                           ) : (
                              <>
                                <div className="mb-6 p-4 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300">
                                   <Upload className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">
                                   Upload {selectedReq.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                                  Drag and drop your file here, or click to browse.
                                </p>
                                <Button 
                                  data-testid="button-choose-file"
                                  size="lg" 
                                  className="bg-slate-900 text-white hover:bg-slate-800 px-8 rounded-full shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl"
                                >
                                  Choose File
                                </Button>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  data-testid="input-file-upload"
                                />
                              </>
                           )}
                        </div>
                    )}
                 </CardContent>
               </Card>
               
               <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-slate-400 font-medium tracking-wide uppercase opacity-60">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Bank-grade Encryption</span>
                  <span className="mx-2">•</span>
                  <span>Secure Transmission</span>
               </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-40">
               <FileIcon className="h-24 w-24 mb-6 text-slate-300" />
               <p className="text-xl font-serif text-slate-400">Select a document to begin</p>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
