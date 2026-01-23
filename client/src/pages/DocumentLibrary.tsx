import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Upload, 
  Search, 
  X, 
  Eye, 
  Download, 
  MoreVertical, 
  FileText,
  Pencil,
  FolderOpen,
  Trash2,
  File,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  useLibraryDocuments, 
  useCreateLibraryDocument, 
  useUpdateLibraryDocument, 
  useDeleteLibraryDocument,
  useChecklistRequirementTemplates,
  useCreateChecklistRequirementTemplate,
  useUpdateChecklistRequirementTemplate,
  useDeleteChecklistRequirementTemplate,
} from "@/hooks/use-client-data";
import type { LibraryDocument, ChecklistRequirementTemplate } from "@shared/schema";
import { FIXED_STAGES } from "@shared/schema";
import { Plus, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = [
  "Lettings",
  "Sales",
  "Compliance",
  "Landlord",
  "Tenant",
  "Internal",
] as const;

type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  Lettings: "bg-blue-100 text-blue-700",
  Sales: "bg-green-100 text-green-700",
  Compliance: "bg-amber-100 text-amber-700",
  Landlord: "bg-purple-100 text-purple-700",
  Tenant: "bg-pink-100 text-pink-700",
  Internal: "bg-slate-100 text-slate-700",
};

import { sharedStore } from "@/lib/sharedStore";

export default function DocumentLibrary() {
  // API Hooks
  const { data: documents = [], isLoading, error } = useLibraryDocuments();
  const createDocument = useCreateLibraryDocument();
  const updateDocument = useUpdateLibraryDocument();
  const deleteDocument = useDeleteLibraryDocument();
  
  // Checklist Template Hooks (using fixed stages)
  const { data: requirementTemplates = [], isLoading: requirementsLoading } = useChecklistRequirementTemplates();
  const createRequirement = useCreateChecklistRequirementTemplate();
  const updateRequirement = useUpdateChecklistRequirementTemplate();
  const deleteRequirement = useDeleteChecklistRequirementTemplate();
  
  // Checklist Template Modal State
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [addingReqToStage, setAddingReqToStage] = useState<string | null>(null);
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDescription, setNewReqDescription] = useState("");
  const [newReqRequired, setNewReqRequired] = useState(true);
  const [editingReq, setEditingReq] = useState<ChecklistRequirementTemplate | null>(null);
  const [editingReqTitle, setEditingReqTitle] = useState("");
  const [editingReqDescription, setEditingReqDescription] = useState("");
  const [editingReqRequired, setEditingReqRequired] = useState(true);

  const handleOpenChecklist = () => {
    // Keep all stages collapsed by default
    setExpandedStages(new Set());
    setIsChecklistOpen(true);
  };

  const toggleStageExpanded = (stageId: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleAddRequirement = async (stageId: string) => {
    if (!newReqTitle.trim()) return;
    const stageReqs = requirementTemplates.filter(r => r.stageId === stageId);
    try {
      await createRequirement.mutateAsync({ 
        stageId: stageId,
        title: newReqTitle.trim(),
        description: newReqDescription.trim() || undefined,
        required: newReqRequired,
        order: stageReqs.length 
      });
      setAddingReqToStage(null);
      setNewReqTitle("");
      setNewReqDescription("");
      setNewReqRequired(true);
      toast({ title: "Requirement added" });
    } catch {
      toast({ title: "Failed to add requirement", variant: "destructive" });
    }
  };

  const handleUpdateRequirement = async () => {
    if (!editingReq || !editingReqTitle.trim()) return;
    try {
      await updateRequirement.mutateAsync({ 
        id: editingReq.id, 
        title: editingReqTitle.trim(),
        description: editingReqDescription.trim() || undefined,
        required: editingReqRequired,
      });
      setEditingReq(null);
      toast({ title: "Requirement updated" });
    } catch {
      toast({ title: "Failed to update requirement", variant: "destructive" });
    }
  };

  const handleDeleteRequirement = async (reqId: string) => {
    try {
      await deleteRequirement.mutateAsync(reqId);
      toast({ title: "Requirement deleted" });
    } catch {
      toast({ title: "Failed to delete requirement", variant: "destructive" });
    }
  };

  const startEditRequirement = (req: ChecklistRequirementTemplate) => {
    setEditingReq(req);
    setEditingReqTitle(req.title);
    setEditingReqDescription(req.description || "");
    setEditingReqRequired(req.required ?? true);
  };

  const startAddRequirement = (stageId: string) => {
    setAddingReqToStage(stageId);
    setNewReqTitle("");
    setNewReqDescription("");
    setNewReqRequired(true);
  };

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "" as Category | "",
    description: "",
    file: null as File | null,
  });

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<LibraryDocument | null>(null);

  // Delete Confirmation State
  const [deleteDoc, setDeleteDoc] = useState<LibraryDocument | null>(null);

  // Rename Modal State
  const [renameDoc, setRenameDoc] = useState<LibraryDocument | null>(null);
  const [newName, setNewName] = useState("");

  // Change Category Modal State
  const [changeCategoryDoc, setChangeCategoryDoc] = useState<LibraryDocument | null>(null);
  const [newCategory, setNewCategory] = useState<Category | "">("");

  // Filtering
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(query) ||
      (doc.description?.toLowerCase().includes(query) ?? false);
    return matchesCategory && matchesSearch;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  // Upload Handler
  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.category || !uploadForm.file) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const fileUrl = URL.createObjectURL(uploadForm.file);
      
      await createDocument.mutateAsync({
        name: uploadForm.name,
        category: uploadForm.category as Category,
        description: uploadForm.description || undefined,
        fileUrl,
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        mimeType: uploadForm.file.type,
      });

      setIsUploadOpen(false);
      setUploadForm({ name: "", category: "", description: "", file: null });
      toast({ title: "Document uploaded", description: `${uploadForm.name} has been added to the library.` });
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload document.", variant: "destructive" });
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await deleteDocument.mutateAsync(deleteDoc.id);
      toast({ title: "Document deleted", description: `${deleteDoc.name} has been removed.` });
      setDeleteDoc(null);
    } catch (err) {
      toast({ title: "Delete failed", description: "Could not delete document.", variant: "destructive" });
    }
  };

  // Rename Handler
  const handleRename = async () => {
    if (!renameDoc || !newName.trim()) return;
    try {
      await updateDocument.mutateAsync({ id: renameDoc.id, name: newName.trim() });
      toast({ title: "Document renamed" });
      setRenameDoc(null);
      setNewName("");
    } catch (err) {
      toast({ title: "Rename failed", description: "Could not rename document.", variant: "destructive" });
    }
  };

  // Change Category Handler
  const handleChangeCategory = async () => {
    if (!changeCategoryDoc || !newCategory) return;
    try {
      await updateDocument.mutateAsync({ id: changeCategoryDoc.id, category: newCategory as Category });
      toast({ title: "Category updated" });
      setChangeCategoryDoc(null);
      setNewCategory("");
    } catch (err) {
      toast({ title: "Update failed", description: "Could not update category.", variant: "destructive" });
    }
  };

  // Download Handler
  const handleDownload = (doc: LibraryDocument) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank');
    }
    toast({ title: "Download started", description: `Downloading ${doc.name}...` });
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout userType="agent">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout userType="agent">
        <div className="text-center py-16">
          <p className="text-destructive">Failed to load documents. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Document Library</h1>
            <p className="text-muted-foreground mt-1">Agency templates and standard documents</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleOpenChecklist}>
              <FileText className="h-4 w-4 mr-2" />
              Manage Document Checklist
            </Button>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* ... (rest of the component) */}

      {/* Document Checklist Template Modal */}
      <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Document Checklist</DialogTitle>
            <DialogDescription>
              Define the stages and documents required when onboarding new tenants. Each new tenant will receive a copy of this checklist.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="py-4 space-y-4">
              {requirementsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                FIXED_STAGES.map((stage) => {
                  const stageReqs = requirementTemplates.filter(r => r.stageId === stage.id);
                  const isExpanded = expandedStages.has(stage.id);
                  
                  return (
                    <div key={stage.id} className="border rounded-lg overflow-hidden">
                      {/* Stage Header - Fixed stages, no edit/delete */}
                      <div 
                        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
                        onClick={() => toggleStageExpanded(stage.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium flex-1">{stage.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stageReqs.length} {stageReqs.length === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      
                      {/* Stage Requirements */}
                      {isExpanded && (
                        <div className="p-3 space-y-2">
                          {stageReqs.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic py-2">No requirements in this stage</p>
                          ) : (
                            stageReqs.map((req) => (
                              <div key={req.id} className="flex items-start gap-2 p-2 rounded-md border bg-white">
                                {editingReq?.id === req.id ? (
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={editingReqTitle}
                                      onChange={e => setEditingReqTitle(e.target.value)}
                                      placeholder="Requirement title"
                                      className="h-8"
                                      autoFocus
                                    />
                                    <Input
                                      value={editingReqDescription}
                                      onChange={e => setEditingReqDescription(e.target.value)}
                                      placeholder="Description (optional)"
                                      className="h-8"
                                    />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={editingReqRequired}
                                          onCheckedChange={setEditingReqRequired}
                                        />
                                        <Label className="text-sm">Required</Label>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={handleUpdateRequirement}>Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingReq(null)}>Cancel</Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{req.title}</span>
                                        {req.required && (
                                          <Badge variant="outline" className="text-xs">Required</Badge>
                                        )}
                                      </div>
                                      {req.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => startEditRequirement(req)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => handleDeleteRequirement(req.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </div>
                            ))
                          )}
                          
                          {/* Add Requirement Form */}
                          {addingReqToStage === stage.id ? (
                            <div className="p-2 rounded-md border-2 border-dashed bg-slate-50 space-y-2">
                              <Input
                                value={newReqTitle}
                                onChange={e => setNewReqTitle(e.target.value)}
                                placeholder="Document title (e.g. Proof of ID)"
                                className="h-8"
                                autoFocus
                              />
                              <Input
                                value={newReqDescription}
                                onChange={e => setNewReqDescription(e.target.value)}
                                placeholder="Description (optional)"
                                className="h-8"
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={newReqRequired}
                                    onCheckedChange={setNewReqRequired}
                                  />
                                  <Label className="text-sm">Required</Label>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleAddRequirement(stage.id)}>Add</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setAddingReqToStage(null)}>Cancel</Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start text-muted-foreground"
                              onClick={() => startAddRequirement(stage.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add requirement
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsChecklistOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal (existing) */}
      {/* ... */}

        {/* Filter Bar */}
        <Card className="bg-white border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              {(searchQuery || categoryFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Document List */}
        {filteredDocuments.length === 0 ? (
          <Card className="bg-white border-border/60 shadow-sm">
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No documents found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" 
                  ? "Try adjusting your filters or search query." 
                  : "Upload your first document to get started."}
              </p>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-border/60 shadow-sm overflow-hidden">
            <div className="divide-y divide-border/60">
              {filteredDocuments.map(doc => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="p-2.5 bg-slate-100 rounded text-slate-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate">{doc.name}</p>
                        <Badge variant="secondary" className={`text-xs shrink-0 ${CATEGORY_COLORS[doc.category] || ''}`}>
                          {doc.category}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded {format(new Date(doc.createdAt), "d MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button variant="outline" size="sm" onClick={() => setPreviewDoc(doc)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenameDoc(doc); setNewName(doc.name); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setChangeCategoryDoc(doc); setNewCategory(doc.category); }}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Change Category
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteDoc(doc)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to the library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name *</Label>
              <Input
                id="docName"
                placeholder="e.g. Tenancy Agreement Template"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docCategory">Category *</Label>
              <Select 
                value={uploadForm.category} 
                onValueChange={(val) => setUploadForm({ ...uploadForm, category: val })}
              >
                <SelectTrigger id="docCategory">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="docFile">File *</Label>
              <div className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <File className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{uploadForm.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select a file</p>
                  </>
                )}
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="docDesc">Description (optional)</Label>
              <Textarea
                id="docDesc"
                placeholder="Brief description of the document..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
            <DialogDescription>
              {previewDoc && (
                <span className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={CATEGORY_COLORS[previewDoc.category] || ''}>
                    {previewDoc.category}
                  </Badge>
                  <span>• Uploaded {format(new Date(previewDoc.createdAt), "d MMM yyyy")}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 rounded-md flex items-center justify-center min-h-[300px] border">
            <div className="text-center p-8">
              <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-1">Document Preview</p>
              <p className="text-xs text-muted-foreground">
                PDF preview supported. Click Download to view the full document.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
            <Button onClick={() => previewDoc && handleDownload(previewDoc)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDoc?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Modal */}
      <Dialog open={!!renameDoc} onOpenChange={() => setRenameDoc(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newName">Document Name</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Modal */}
      <Dialog open={!!changeCategoryDoc} onOpenChange={() => setChangeCategoryDoc(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Category</Label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeCategoryDoc(null)}>Cancel</Button>
            <Button onClick={handleChangeCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
