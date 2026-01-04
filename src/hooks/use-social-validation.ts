import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import type { IdeaBacker } from "@/types/database";

interface BackingResponse {
    data: IdeaBacker[];
    meta: {
        total_pledged: number;
        backers_count: number;
    };
}

export function useIdeaBackers(ideaId: string) {
    return useQuery<BackingResponse>({
        queryKey: ["idea_backers_v2", ideaId], // Changed key to force cache refresh
        queryFn: async () => {
            const response = await apiClient.get<BackingResponse>(`/api/ideas/${ideaId}/backers`);
            if (response.error) throw new Error(response.error.message);
            return response.data!; // apiClient wrapper returns { data, error }
        },
    });
}

export function useBackIdea(ideaId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { pledge_amount: number; comment?: string; is_anonymous?: boolean }) => {
            const response = await apiClient.post(`/api/ideas/${ideaId}/back`, data);
            if (response.error) throw new Error(response.error.message);
            return response.data;
        },
        onSuccess: async () => {
            // Force refetch the backers data
            await queryClient.invalidateQueries({ queryKey: ["idea_backers_v2", ideaId] });
            await queryClient.refetchQueries({ queryKey: ["idea_backers_v2", ideaId] });
            toast.success("Thanks for backing this idea!");
        },
        onError: (error) => {
            console.error("Backing failed:", error);
            toast.error("Failed to back idea. Please try again.");
        },
    });
}
