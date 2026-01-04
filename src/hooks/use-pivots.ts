"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPivot, fetchVersionHistory } from "@/lib/api/client/pivots";
import { toast } from "sonner";
import { ideaKeys } from "./use-ideas";
import type { CreatePivotRequest } from "@/types/api";

export const pivotKeys = {
  history: (ideaId: string) => [...ideaKeys.detail(ideaId), "history"] as const,
};

/**
 * Hook to fetch version history for an idea
 */
export function useVersionHistory(ideaId: string) {
  return useQuery({
    queryKey: pivotKeys.history(ideaId),
    queryFn: () => fetchVersionHistory(ideaId),
    enabled: !!ideaId,
  });
}

/**
 * Hook to create a pivot
 */
export function useCreatePivot(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePivotRequest) => createPivot(ideaId, data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) });
      queryClient.invalidateQueries({ queryKey: pivotKeys.history(ideaId) });
      queryClient.invalidateQueries({ queryKey: ideaKeys.all });
      
      toast.success("Pivot created successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create pivot");
    },
  });
}
