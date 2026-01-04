import type { IdeaLevel, IdeaFeedback } from "@/types/database";

const API_BASE = "/api/ideas";

/**
 * Fetch levels for an idea
 */
export async function fetchIdeaLevels(ideaId: string): Promise<{ data: IdeaLevel[] }> {
    const response = await fetch(`${API_BASE}/${ideaId}/levels`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch levels");
    }

    return response.json();
}

/**
 * Update a specific level for an idea
 */
export async function updateIdeaLevel(
    ideaId: string,
    levelNumber: number,
    data: any
): Promise<{ data: IdeaLevel }> {
    const response = await fetch(`${API_BASE}/${ideaId}/levels/${levelNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update level");
    }

    return response.json();
}

/**
 * Fetch feedback for an idea, optionally filtered by level
 */
export async function fetchIdeaFeedback(ideaId: string, level?: number): Promise<{ data: IdeaFeedback[] }> {
    const url = level ? `${API_BASE}/${ideaId}/feedback?level=${level}` : `${API_BASE}/${ideaId}/feedback`;
    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch feedback");
    }

    return response.json();
}

/**
 * Post feedback for a specific level
 */
export async function postIdeaFeedback(
    ideaId: string,
    levelNumber: number,
    content: string,
    ratings: Record<string, number> = {}
): Promise<{ data: IdeaFeedback }> {
    const response = await fetch(`${API_BASE}/${ideaId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level_number: levelNumber, content, ratings }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to post feedback");
    }

    return response.json();
}
