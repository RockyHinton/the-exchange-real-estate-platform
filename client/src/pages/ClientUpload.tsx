import Layout from "@/components/Layout";
import { MOCK_PROPERTIES } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Upload, FileText, Check, FileCheck, Info, ChevronRight, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
            title: "Upload Complete",
            description: "Your document has been securely uploaded and sent for review.",
          });
          return { ...prev, [docId]: 100 };
        }
        return { ...prev, [docId]: current + 20 };
      });
    }, 400);
  };

  const selectedDoc = property.documents.find(d => d.id === selectedDocId);

  return (
    <Layout userType="client">
      <div className="max-w-[1600px] mx-auto w-full px-6 py-8 h-[calc(100vh-80px)]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground mt-1">Manage and upload your tenancy documents.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-full border">
             <span className="font-medium text-foreground">{property.documents.filter(d => d.status === 'approved').length}</span>
             <span>of</span>
             <span className="font-medium text-foreground">{property.documents.length}</span>
             <span>completed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100%-100px)]">
          {/* Document List Sidebar */}
          <Card className="lg:col-span-4 h-full border-border/60 flex flex-col overflow-hidden bg-white shadow-sm">
             <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Required Documents</h2>
             </div>
             <ScrollArea className="flex-1 bg-slate-50/30">
                <div className="p-4 space-y-3">
                   {property.documents.map((doc) => {
                     const isSelected = selectedDocId === doc.id;
                     const isApproved = doc.status === 'approved';
                     
                     return (
                       <div 
                         key={doc.id}
                         onClick={() => setSelectedDocId(doc.id)}
                         className={cn(
                           "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden",
                           isSelected 
                             ? "bg-white border-primary shadow-md ring-1 ring-primary/5 z-10" 
                             : "bg-white border-border/60 hover:border-border hover:shadow-sm hover:-translate-y-0.5",
                           isApproved && !isSelected && "opacity-60 hover:opacity-100 bg-slate-50/50"
                         )}
                       >
                         {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />}
                         
                         <div className={cn(
                           "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors border shadow-sm",
                           isSelected ? "bg-primary/5 border-primary/20 text-primary" : "bg-white border-slate-100 text-slate-400 group-hover:border-slate-200",
                           isApproved && "bg-green-50 border-green-200 text-green-600"
                         )}>
                            {isApproved ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                         </div>

                         <div className="flex-1 min-w-0 py-0.5">
                           <div className="flex justify-between items-center mb-1">
                             <p className={cn("font-medium text-sm truncate", isSelected ? "text-foreground font-semibold" : "text-slate-700")}>
                               {doc.name}
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn(
                               "text-[10px] h-5 px-2 font-medium border",
                               doc.status === 'approved' ? "bg-green-50 text-green-700 border-green-200" :
                               doc.status === 'in_review' ? "bg-amber-50 text-amber-700 border-amber-200" :
                               doc.status === 'pending' ? "bg-slate-50 text-slate-600 border-slate-200" : 
                               "bg-red-50 text-red-700 border-red-200"
                             )}>
                               {doc.status.replace('_', ' ')}
                             </Badge>
                             {doc.dueDate && !isApproved && (
                               <span className={cn(
                                 "text-[11px] flex items-center gap-1 font-medium",
                                 new Date(doc.dueDate) < new Date() ? "text-red-600" : "text-muted-foreground"
                               )}>
                                 {new Date(doc.dueDate) < new Date() && <Clock className="h-3 w-3" />}
                                 {new Date(doc.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                               </span>
                             )}
                           </div>
                         </div>
                         
                         {isSelected && <ChevronRight className="h-5 w-5 text-primary opacity-50" />}
                       </div>
                     );
                   })}
                </div>
             </ScrollArea>
          </Card>

          {/* Upload Area */}
          <div className="lg:col-span-8 h-full">
             <Card className="h-full bg-white border-border/60 shadow-sm flex flex-col overflow-hidden">
               {selectedDoc ? (
                 <>
                   <CardHeader className="border-b border-border/40 pb-6 bg-slate-50/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
                              {selectedDoc.type}
                            </Badge>
                            <StatusBadge status={selectedDoc.status} />
                          </div>
                          <CardTitle className="font-serif text-2xl">
                            {selectedDoc.name}
                          </CardTitle>
                          <CardDescription className="mt-2 text-base max-w-2xl">
                            {selectedDoc.description}
                          </CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   
                   <CardContent className="flex-1 p-8 flex flex-col justify-center bg-slate-50/10">
                     {selectedDoc.status === 'approved' ? (
                        <div className="flex flex-col items-center text-center max-w-md mx-auto">
                           <div className="h-24 w-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                              <Check className="h-12 w-12" />
                           </div>
                           <h3 className="text-xl font-medium text-foreground">Document Approved</h3>
                           <p className="text-muted-foreground mt-2">This document has been verified by your agent. No further action is required.</p>
                        </div>
                     ) : uploadProgress[selectedDoc.id] === 100 || selectedDoc.status === 'in_review' ? (
                         <div className="flex flex-col items-center text-center max-w-md mx-auto">
                           <div className="h-24 w-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                              <FileCheck className="h-12 w-12" />
                           </div>
                           <h3 className="text-xl font-medium text-foreground">Upload Successful</h3>
                           <p className="text-muted-foreground mt-2">Your document has been sent to your agent for review. We'll notify you once it's approved.</p>
                        </div>
                     ) : (
                        <div className="w-full max-w-xl mx-auto space-y-8">
                          {selectedDoc.dueDate && (
                            <div className={cn(
                              "px-4 py-3 rounded-md border flex items-center gap-3 text-sm",
                              (() => {
                                 const due = new Date(selectedDoc.dueDate);
                                 const now = new Date();
                                 const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                 if (diffDays < 0) return "bg-red-50 border-red-200 text-red-800";
                                 if (diffDays <= 3) return "bg-orange-50 border-orange-200 text-orange-800";
                                 return "bg-slate-50 border-slate-200 text-slate-700";
                              })()
                            )}>
                              <Info className="h-4 w-4 shrink-0" />
                              <span className="font-medium">
                                {(() => {
                                   const due = new Date(selectedDoc.dueDate);
                                   const now = new Date();
                                   const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                   if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
                                   if (diffDays === 0) return "Due today";
                                   return `Due by ${due.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`;
                                })()}
                              </span>
                            </div>
                          )}

                          <div 
                            className={cn(
                              "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[320px] bg-white",
                              "border-slate-200 hover:border-primary/50 hover:bg-slate-50/50 hover:shadow-sm group cursor-pointer"
                            )}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploadProgress[selectedDoc.id] > 0 ? (
                              <div className="w-full max-w-xs space-y-4">
                                 <div className="flex items-center justify-between text-sm font-medium">
                                   <span>Uploading...</span>
                                   <span>{uploadProgress[selectedDoc.id]}%</span>
                                 </div>
                                 <Progress value={uploadProgress[selectedDoc.id]} className="h-2" />
                              </div>
                            ) : (
                              <>
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                                   <Upload className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-medium text-foreground mb-2">Click to upload or drag & drop</h3>
                                <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                                  Supported formats: PDF, JPG, PNG (Max 10MB)
                                </p>
                                <Button variant="default" className="shadow-sm">
                                  Select File
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
                          
                          <div className="flex justify-center">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 opacity-70">
                              <Info className="h-3 w-3" />
                              Documents are encrypted and securely stored
                            </p>
                          </div>
                        </div>
                     )}
                   </CardContent>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                   <FileText className="h-16 w-16 mb-4 opacity-10" />
                   <p className="text-lg font-medium text-foreground/80">Select a document</p>
                   <p className="text-sm">Choose a document from the list on the left to view details or upload.</p>
                 </div>
               )}
             </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
