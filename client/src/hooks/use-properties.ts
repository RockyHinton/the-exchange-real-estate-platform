import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, User } from "@shared/schema";

export interface PropertyWithClient extends Property {
  client?: User | null;
}

async function fetchProperties(): Promise<PropertyWithClient[]> {
  const response = await fetch("/api/properties", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function createProperty(data: {
  address: string;
  city: string;
  postcode: string;
  price: string;
  imageUrl?: string;
  clientEmail?: string;
  clientName?: string;
  guarantorRequired?: boolean;
}): Promise<Property> {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create property");
  }

  return response.json();
}

async function updateProperty(
  id: string,
  data: Partial<{
    address: string;
    city: string;
    postcode: string;
    price: string;
    imageUrl: string;
    clientEmail: string;
    clientName: string;
    status: string;
    lifecycleStatus: string;
    guarantorRequired: boolean;
  }>
): Promise<Property> {
  const response = await fetch(`/api/properties/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update property");
  }

  return response.json();
}

async function deleteProperty(id: string): Promise<void> {
  const response = await fetch(`/api/properties/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete property");
  }
}

export function useProperties() {
  return useQuery<PropertyWithClient[]>({
    queryKey: ["/api/properties"],
    queryFn: fetchProperties,
    staleTime: 1000 * 60 * 2,
  });
}

async function fetchProperty(id: string): Promise<PropertyWithClient> {
  const response = await fetch(`/api/properties/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useProperty(id: string | undefined) {
  return useQuery<PropertyWithClient>({
    queryKey: ["/api/properties", id],
    queryFn: () => fetchProperty(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateProperty>[1] }) =>
      updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.removeQueries({ queryKey: ["/api/properties", id] });
    },
  });
}
