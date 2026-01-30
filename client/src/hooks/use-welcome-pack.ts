import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WelcomePackItem, WelcomePackField } from "@shared/schema";

export function useWelcomePack(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "welcome-pack"],
    queryFn: async () => {
      if (!propertyId) return [];
      const response = await fetch(`/api/properties/${propertyId}/welcome-pack`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch welcome pack");
      }
      return response.json() as Promise<WelcomePackItem[]>;
    },
    enabled: !!propertyId,
  });
}

export function useCreateWelcomePackItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      data,
    }: {
      propertyId: string;
      data: {
        category: string;
        title: string;
        description?: string;
        icon: string;
        fields: WelcomePackField[];
        orderIndex?: number;
      };
    }) => {
      const response = await fetch(`/api/properties/${propertyId}/welcome-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create welcome pack item");
      }
      return response.json() as Promise<WelcomePackItem>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/properties", variables.propertyId, "welcome-pack"],
      });
    },
  });
}

export function useUpdateWelcomePackItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      propertyId,
      data,
    }: {
      itemId: string;
      propertyId: string;
      data: Partial<{
        category: string;
        title: string;
        description: string | null;
        icon: string;
        fields: WelcomePackField[];
        orderIndex: number;
      }>;
    }) => {
      const response = await fetch(`/api/welcome-pack/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update welcome pack item");
      }
      return response.json() as Promise<WelcomePackItem>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/properties", variables.propertyId, "welcome-pack"],
      });
    },
  });
}

export function useDeleteWelcomePackItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      propertyId,
    }: {
      itemId: string;
      propertyId: string;
    }) => {
      const response = await fetch(`/api/welcome-pack/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete welcome pack item");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/properties", variables.propertyId, "welcome-pack"],
      });
    },
  });
}

export const CATEGORY_LABELS: Record<string, string> = {
  wifi_internet: "WiFi & Internet",
  heating_utilities: "Heating & Utilities",
  bins_recycling: "Bins & Recycling",
  emergency_contacts: "Emergency Contacts",
  house_rules: "House Rules",
  local_info: "Local Information",
  amenities: "Amenities",
  custom: "Custom",
};

export const CATEGORY_ICONS: Record<string, string> = {
  wifi_internet: "wifi",
  heating_utilities: "thermometer",
  bins_recycling: "trash-2",
  emergency_contacts: "phone",
  house_rules: "clipboard-list",
  local_info: "map-pin",
  amenities: "home",
  custom: "file-text",
};
