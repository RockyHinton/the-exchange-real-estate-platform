import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, Document, Payment, Report, ReportMessage, Message, User, WelcomePackItem, LibraryDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export interface PropertyWithDetails extends Property {
  client?: User | null;
}

export interface ReportWithMessages extends Report {
  messages: ReportMessage[];
}

async function fetchClientProperties(): Promise<PropertyWithDetails[]> {
  const response = await fetch("/api/properties", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchPropertyDocuments(propertyId: string): Promise<Document[]> {
  const response = await fetch(`/api/properties/${propertyId}/documents`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchPropertyPayments(propertyId: string): Promise<Payment[]> {
  const response = await fetch(`/api/properties/${propertyId}/payments`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchPropertyReports(propertyId: string): Promise<ReportWithMessages[]> {
  const response = await fetch(`/api/properties/${propertyId}/reports`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const reports = await response.json();
  
  const reportsWithMessages = await Promise.all(
    reports.map(async (report: Report) => {
      const messagesResponse = await fetch(`/api/reports/${report.id}/messages`, {
        credentials: "include",
      });
      const messages = messagesResponse.ok ? await messagesResponse.json() : [];
      return { ...report, messages };
    })
  );

  return reportsWithMessages;
}

async function fetchPropertyMessages(propertyId: string): Promise<Message[]> {
  const response = await fetch(`/api/properties/${propertyId}/messages`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchWelcomePack(propertyId: string): Promise<WelcomePackItem[]> {
  const response = await fetch(`/api/properties/${propertyId}/welcome-pack`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useClientProperties() {
  return useQuery({
    queryKey: ["/api/properties"],
    queryFn: fetchClientProperties,
  });
}

export function usePropertyDocuments(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "documents"],
    queryFn: () => fetchPropertyDocuments(propertyId!),
    enabled: !!propertyId,
  });
}

export function usePropertyPayments(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "payments"],
    queryFn: () => fetchPropertyPayments(propertyId!),
    enabled: !!propertyId,
  });
}

export function usePropertyReports(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "reports"],
    queryFn: () => fetchPropertyReports(propertyId!),
    enabled: !!propertyId,
  });
}

export function usePropertyMessages(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "messages"],
    queryFn: () => fetchPropertyMessages(propertyId!),
    enabled: !!propertyId,
  });
}

export function useWelcomePack(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "welcome-pack"],
    queryFn: () => fetchWelcomePack(propertyId!),
    enabled: !!propertyId,
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: "unpaid" | "pending" | "paid" }) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, category, priority, description }: { 
      propertyId: string; 
      category: "maintenance" | "admin" | "urgent";
      priority: "low" | "medium" | "high";
      description: string;
    }) => {
      const response = await apiRequest("POST", `/api/properties/${propertyId}/reports`, {
        category,
        priority,
        description
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "reports"] });
    },
  });
}

export function useAddReportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, content, propertyId }: { reportId: string; content: string; propertyId: string }) => {
      const response = await apiRequest("POST", `/api/reports/${reportId}/messages`, { content });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "reports"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, receiverId, content }: { propertyId: string; receiverId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/properties/${propertyId}/messages`, {
        receiverId,
        content
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "messages"] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId }: { propertyId: string }) => {
      const response = await apiRequest("POST", `/api/properties/${propertyId}/messages/mark-read`, {});
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "messages"] });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, file }: { documentId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/documents/${documentId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useUpdateLifecycleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, status }: { propertyId: string; status: "onboarding_in_progress" | "onboarding_ready_to_confirm" | "approved_active_tenancy" }) => {
      const response = await apiRequest("PATCH", `/api/properties/${propertyId}/lifecycle`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, status, rejectionReason }: { documentId: string; status: string; rejectionReason?: string }) => {
      const response = await apiRequest("PATCH", `/api/documents/${documentId}/status`, { status, rejectionReason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: "open" | "resolved" | "ignored" }) => {
      const response = await apiRequest("PATCH", `/api/reports/${reportId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

// Library Documents hooks
async function fetchLibraryDocuments(): Promise<LibraryDocument[]> {
  const response = await fetch("/api/library-documents", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useLibraryDocuments() {
  return useQuery({
    queryKey: ["/api/library-documents"],
    queryFn: fetchLibraryDocuments,
  });
}

export function useCreateLibraryDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: "Lettings" | "Sales" | "Compliance" | "Landlord" | "Tenant" | "Internal";
      description?: string;
      fileUrl: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      const response = await apiRequest("POST", "/api/library-documents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-documents"] });
    },
  });
}

export function useUpdateLibraryDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      category?: "Lettings" | "Sales" | "Compliance" | "Landlord" | "Tenant" | "Internal";
      description?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/library-documents/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-documents"] });
    },
  });
}

export function useDeleteLibraryDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/library-documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-documents"] });
    },
  });
}
