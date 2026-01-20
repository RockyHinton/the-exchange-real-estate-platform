import Layout from "@/components/Layout";
import { MOCK_PROPERTIES } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, FileCheck, Info, ChevronRight, Clock, ShieldCheck, FileIcon } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function ClientUpload() {
  const property = MOCK_PROPERTIES[0];
  // Select the first pending/rejected document by default if none selected
  const firstActionableDoc = property.documents.find(d => d.status === 'pending' || d.status === 'rejected') || property.documents[0];
  const [selectedDocId, setSelectedDocId] = useState<string | null>(firstActionableDoc?.id || null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedDocId) {
      simulateUpload(selectedDocId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDocId) {
       simulateUpload(selectedDocId);
    }
  };

  const simulateUpload = (docId: string) => {
    setUploadProgress(prev => ({ ...prev, [docId]: 10 }));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[docId] || 0;
        if (current >= 100) {
          clearInterval(interval);
          toast({
            title: "Document Uploaded",
            description: "Your file has been securely transmitted for review.",
          });
          return { ...prev, [docId]: 100 };
        }
        return { ...prev, [docId]: current + 20 };
      });
    }, 400);
  };

  const selectedDoc = property.documents.find(d => d.id === selectedDocId);
  const completedCount = property.documents.filter(d => d.status === 'approved').length;
  const totalCount = property.documents.length;

  return (
    <Layout userType="client">
      {/* Main Container - Full Height, No Page Scroll */}
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50/50">
        
        {/* LEFT COLUMN: Document Navigator (Scrollable) */}
        <div className="w-full max-w-[420px] bg-white border-r border-slate-200/60 flex flex-col h-full shadow-sm z-10">
          {/* Header */}
          <div className="px-8 py-8 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
               <h1 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
               <span className="text-xs font-medium text-slate-400 font-mono">
                  {completedCount} / {totalCount}
               </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Please upload the required documents to verify your tenancy application.
            </p>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {property.documents.map((doc) => {
               const isSelected = selectedDocId === doc.id;
               const isApproved = doc.status === 'approved';
               const isPending = doc.status === 'pending';
               const isInReview = doc.status === 'in_review';
               
               return (
                 <div 
                   key={doc.id}
                   onClick={() => setSelectedDocId(doc.id)}
                   className={cn(
                     "group relative p-5 rounded-xl cursor-pointer transition-all duration-300 border select-none",
                     isSelected 
                       ? "bg-white border-slate-900/10 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5 translate-x-1" 
                       : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/50 hover:shadow-sm",
                     isApproved && !isSelected && "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                   )}
                 >
                   {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-slate-900 rounded-r-full" />
                   )}
                   
                   <div className="flex items-start gap-4">
                     <div className={cn(
                       "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors border shadow-sm mt-0.5",
                       isApproved ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                       isSelected ? "bg-slate-900 text-white border-slate-900" : 
                       "bg-white border-slate-100 text-slate-400 group-hover:border-slate-200"
                     )}>
                        {isApproved ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                     </div>

                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1.5">
                         <h3 className={cn(
                           "font-medium text-[15px] truncate pr-2", 
                           isSelected ? "text-slate-900" : "text-slate-700"
                         )}>
                           {doc.name}
                         </h3>
                         {doc.dueDate && !isApproved && (
                            <span className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0",
                                new Date(doc.dueDate) < new Date() 
                                    ? "bg-red-50 text-red-600 border-red-100" 
                                    : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                                Due {new Date(doc.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                         )}
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <span className={cn(
                           "text-[11px] font-medium uppercase tracking-wider",
                           isApproved ? "text-emerald-600" :
                           isInReview ? "text-amber-600" :
                           "text-slate-400"
                         )}>
                            {doc.status.replace('_', ' ')}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
             
             {/* Bottom Spacer */}
             <div className="h-12" />
          </div>
        </div>

        {/* RIGHT COLUMN: Fixed Details & Upload (No Scroll) */}
        <div className="flex-1 h-full flex items-center justify-center p-12 bg-slate-50/50">
          
          {selectedDoc ? (
            <div className="w-full max-w-3xl h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {/* Document Header */}
               <div className="mb-10 text-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                        "mb-4 px-3 py-1 text-xs uppercase tracking-widest bg-white shadow-sm font-medium",
                        selectedDoc.status === 'approved' ? "text-emerald-600 border-emerald-200" : "text-slate-500 border-slate-200"
                    )}
                  >
                    {selectedDoc.type}
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3">
                    {selectedDoc.name}
                  </h2>
                  <p className="text-lg text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
                    {selectedDoc.description}
                  </p>
               </div>

               {/* Action Area */}
               <Card className="border-0 shadow-xl shadow-slate-200/60 bg-white rounded-2xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                 
                 <CardContent className="p-10 md:p-16">
                    {selectedDoc.status === 'approved' ? (
                        <div className="flex flex-col items-center justify-center py-8">
                           <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <ShieldCheck className="h-10 w-10" />
                           </div>
                           <h3 className="text-xl font-medium text-slate-900 mb-2">Document Verified</h3>
                           <p className="text-slate-500 text-center max-w-sm">
                              This document has been reviewed and approved by your agent.
                           </p>
                        </div>
                    ) : uploadProgress[selectedDoc.id] === 100 || selectedDoc.status === 'in_review' ? (
                        <div className="flex flex-col items-center justify-center py-8">
                           <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                              <FileCheck className="h-10 w-10" />
                           </div>
                           <h3 className="text-xl font-medium text-slate-900 mb-2">Submission Received</h3>
                           <p className="text-slate-500 text-center max-w-sm">
                              Your document is currently being reviewed. We will notify you once approved.
                           </p>
                        </div>
                    ) : (
                        <div 
                          className={cn(
                            "group relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300",
                            "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50",
                            "flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
                          )}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                           {uploadProgress[selectedDoc.id] > 0 ? (
                              <div className="w-full max-w-xs space-y-4">
                                 <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                   <span>Encrypting & Uploading...</span>
                                   <span>{uploadProgress[selectedDoc.id]}%</span>
                                 </div>
                                 <Progress value={uploadProgress[selectedDoc.id]} className="h-1.5 bg-slate-100 [&>div]:bg-slate-800" />
                              </div>
                           ) : (
                              <>
                                <div className="mb-6 p-4 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-300">
                                   <Upload className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">
                                   Upload {selectedDoc.name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                                  Drag and drop your file here, or click to browse.
                                </p>
                                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 px-8 rounded-full shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl">
                                  Choose File
                                </Button>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
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
