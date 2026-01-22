import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, PropertyClient, User } from "@shared/schema";

export interface PropertyWithClient extends Property {
  client?: User | null;
}

export interface PropertyClientWithUser extends PropertyClient {
  user?: User | null;
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

// Property Clients hooks
async function fetchPropertyClients(propertyId: string): Promise<PropertyClientWithUser[]> {
  const response = await fetch(`/api/properties/${propertyId}/clients`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function addPropertyClient(
  propertyId: string,
  data: { clientEmail: string; clientName?: string; clientPhone?: string; clientDateOfBirth?: string }
): Promise<PropertyClientWithUser> {
  const response = await fetch(`/api/properties/${propertyId}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add client");
  }

  return response.json();
}

async function updatePropertyClient(
  propertyId: string,
  clientId: string,
  data: { clientEmail?: string; clientName?: string; lifecycleStatus?: string }
): Promise<PropertyClient> {
  const response = await fetch(`/api/properties/${propertyId}/clients/${clientId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update client");
  }

  return response.json();
}

async function removePropertyClient(propertyId: string, clientId: string, endTenancy: boolean = false): Promise<void> {
  const response = await fetch(`/api/properties/${propertyId}/clients/${clientId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endTenancy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove client");
  }
}

export function usePropertyClients(propertyId: string | undefined) {
  return useQuery<PropertyClientWithUser[]>({
    queryKey: ["/api/properties", propertyId, "clients"],
    queryFn: () => fetchPropertyClients(propertyId!),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddPropertyClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: { clientEmail: string; clientName?: string; clientPhone?: string; clientDateOfBirth?: string } }) =>
      addPropertyClient(propertyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "clients"] });
    },
  });
}

export function useUpdatePropertyClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      clientId,
      data,
    }: {
      propertyId: string;
      clientId: string;
      data: { clientEmail?: string; clientName?: string; lifecycleStatus?: string };
    }) => updatePropertyClient(propertyId, clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "clients"] });
    },
  });
}

export function useRemovePropertyClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, clientId, endTenancy }: { propertyId: string; clientId: string; endTenancy?: boolean }) =>
      removePropertyClient(propertyId, clientId, endTenancy || false),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "clients"] });
      if (variables.endTenancy) {
        queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "reports"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.propertyId, "payments"] });
      }
    },
  });
}
