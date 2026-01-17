import Layout from "@/components/Layout";
import { MOCK_PROPERTIES } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Upload, FileText, X, Check, FileCheck, Info } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function ClientUpload() {
  const property = MOCK_PROPERTIES[0];
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
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
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Review status and upload required files.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Document List */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 overflow-y-auto pr-2">
             <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Checklist</h2>
             <div className="space-y-4">
               {property.documents.map((doc) => (
                 <div 
                   key={doc.id}
                   onClick={() => setSelectedDocId(doc.id)}
                   className={cn(
                     "p-5 rounded-xl border cursor-pointer transition-all duration-200",
                     selectedDocId === doc.id 
                       ? "bg-white border-primary shadow-md ring-1 ring-primary/5 translate-x-1" 
                       : "bg-white border-border/60 hover:border-border hover:bg-slate-50 hover:shadow-sm",
                     doc.status === 'approved' && "opacity-75"
                   )}
                 >
                   <div className="flex justify-between items-start mb-3">
                     <FileText className={cn("h-6 w-6", selectedDocId === doc.id ? "text-primary" : "text-muted-foreground")} />
                     <StatusBadge status={doc.status} />
                   </div>
                   <div className="mb-1">
                     <p className="font-medium text-foreground text-base">{doc.name}</p>
                     <p className="text-sm text-muted-foreground mt-1">{doc.type}</p>
                   </div>
                   
                   {doc.dueDate && doc.status !== 'approved' && (
                     <div className={cn(
                       "text-xs font-medium mt-3 flex items-center gap-1.5",
                       (() => {
                         const due = new Date(doc.dueDate);
                         const now = new Date();
                         const diffTime = due.getTime() - now.getTime();
                         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                         
                         if (diffDays < 0) return "text-red-600";
                         if (diffDays <= 3) return "text-orange-600";
                         return "text-muted-foreground";
                       })()
                     )}>
                        {(() => {
                         const due = new Date(doc.dueDate);
                         const now = new Date();
                         const diffTime = due.getTime() - now.getTime();
                         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                         
                         if (diffDays < 0) return (
                           <>
                             <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                             Overdue by {Math.abs(diffDays)} days
                           </>
                         );
                         if (diffDays <= 3) return (
                           <>
                             <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                             Due in {diffDays} days
                           </>
                         );
                         return (
                           <>
                             <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                             Due by {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </>
                         );
                       })()}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>

          {/* Upload Area */}
          <div className="lg:col-span-8 xl:col-span-9 h-full pb-6">
             <Card className="h-full bg-white border-border/60 shadow-sm flex flex-col">
               <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="font-serif">
                    {selectedDoc ? selectedDoc.name : "Select a document"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDoc ? selectedDoc.description : "Choose a document from the list to upload."}
                  </CardDescription>
               </CardHeader>
               
               <CardContent className="flex-1 p-6 flex flex-col justify-center">
                 {!selectedDoc ? (
                    <div className="text-center text-muted-foreground py-12">
                       <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                       <p>Please select a document from the checklist</p>
                    </div>
                 ) : selectedDoc.status === 'approved' ? (
                    <div className="text-center py-12">
                       <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="h-10 w-10" />
                       </div>
                       <h3 className="text-lg font-medium text-foreground">Document Approved</h3>
                       <p className="text-muted-foreground mt-2">No further action required.</p>
                    </div>
                 ) : uploadProgress[selectedDoc.id] === 100 || selectedDoc.status === 'in_review' ? (
                     <div className="text-center py-12">
                       <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileCheck className="h-10 w-10" />
                       </div>
                       <h3 className="text-lg font-medium text-foreground">Upload Successful</h3>
                       <p className="text-muted-foreground mt-2">Your document is being reviewed by your agent.</p>
                    </div>
                 ) : (
                    <div className="space-y-6">
                      {selectedDoc.dueDate && (
                        <div className={cn(
                          "p-4 rounded-lg border flex items-center gap-3",
                          (() => {
                             const due = new Date(selectedDoc.dueDate);
                             const now = new Date();
                             const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                             if (diffDays < 0) return "bg-red-50 border-red-200 text-red-800";
                             if (diffDays <= 3) return "bg-orange-50 border-orange-200 text-orange-800";
                             return "bg-slate-50 border-slate-200 text-slate-700";
                          })()
                        )}>
                          <Info className="h-5 w-5 shrink-0" />
                          <div className="text-sm">
                            <span className="font-semibold">Deadline: </span>
                            {(() => {
                               const due = new Date(selectedDoc.dueDate);
                               const now = new Date();
                               const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                               if (diffDays < 0) return `This document was due ${Math.abs(diffDays)} days ago. Please upload immediately.`;
                               if (diffDays === 0) return "This document is due today.";
                               if (diffDays <= 3) return `This document is due in ${diffDays} days.`;
                               return `Please upload this document by ${due.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`;
                            })()}
                          </div>
                        </div>
                      )}

                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-xl p-10 text-center transition-colors flex flex-col items-center justify-center min-h-[300px]",
                          "border-border hover:border-primary/50 hover:bg-slate-50"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        {uploadProgress[selectedDoc.id] > 0 ? (
                          <div className="w-full max-w-xs space-y-4">
                             <div className="flex items-center justify-between text-sm">
                               <span>Uploading...</span>
                               <span>{uploadProgress[selectedDoc.id]}%</span>
                             </div>
                             <Progress value={uploadProgress[selectedDoc.id]} />
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500">
                               <Upload className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Drag & Drop your file here</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                              Supported formats: PDF, JPG, PNG (Max 10MB)
                            </p>
                            <input 
                              type="file" 
                              className="hidden" 
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                            />
                            <Button onClick={() => fileInputRef.current?.click()}>
                              Browse Files
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                 )}
               </CardContent>
               
               {selectedDoc && selectedDoc.status !== 'approved' && (
                 <div className="p-4 bg-slate-50 border-t border-border/40 text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Secure upload. Your documents are encrypted and only visible to authorized agents.</p>
                 </div>
               )}
             </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
