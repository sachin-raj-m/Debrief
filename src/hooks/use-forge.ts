"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIdeaLevels, updateIdeaLevel } from "@/lib/api/client/forge";
import { toast } from "sonner";
import { ideaKeys } from "./use-ideas";

export const forgeKeys = {
    levels: (ideaId: string) => [...ideaKeys.detail(ideaId), "levels"] as const,
    feedback: (ideaId: string, level?: number) =>
        [...ideaKeys.detail(ideaId), "feedback", { level }] as const,
};

/**
 * Hook to fetch idea levels
 */
export function useIdeaLevels(ideaId: string) {
    return useQuery({
        queryKey: forgeKeys.levels(ideaId),
        queryFn: () => fetchIdeaLevels(ideaId),
        enabled: !!ideaId,
    });
}

/**
 * Hook to update an idea level
 */
export function useUpdateIdeaLevel(ideaId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ levelNumber, data }: { levelNumber: number; data: any }) =>
            updateIdeaLevel(ideaId, levelNumber, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: forgeKeys.levels(ideaId) });
            queryClient.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) }); // Refresh idea for current_level update if needed
            toast.success("Level progress saved!");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to save level");
        },
    });
}

import { fetchIdeaFeedback, postIdeaFeedback } from "@/lib/api/client/forge";

/**
 * Hook to fetch feedback
 */
export function useIdeaFeedback(ideaId: string, level?: number) {
    return useQuery({
        queryKey: forgeKeys.feedback(ideaId, level),
        queryFn: () => fetchIdeaFeedback(ideaId, level),
        enabled: !!ideaId,
    });
}

/**
 * Hook to post feedback
 */
export function usePostIdeaFeedback(ideaId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ levelNumber, content, ratings }: { levelNumber: number; content: string; ratings?: Record<string, number> }) =>
            postIdeaFeedback(ideaId, levelNumber, content, ratings),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: forgeKeys.feedback(ideaId) }); // Invalidate all feedback for idea
            queryClient.invalidateQueries({ queryKey: forgeKeys.feedback(ideaId, variables.levelNumber) });
            toast.success("Feedback posted!");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to post feedback");
        },
    });
}
