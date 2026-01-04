/**
 * API Client - Pivots & Version History
 */

import type {
  CreatePivotRequest,
  CreatePivotResponse,
  GetVersionHistoryResponse,
} from "@/types/api";

/**
 * Create a pivot (version snapshot + optional update)
 */
export async function createPivot(
  ideaId: string,
  data: CreatePivotRequest
): Promise<CreatePivotResponse> {
  const response = await fetch(`/api/ideas/${ideaId}/pivot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create pivot");
  }

  return response.json();
}

/**
 * Fetch version history for an idea
 */
export async function fetchVersionHistory(
  ideaId: string
): Promise<GetVersionHistoryResponse> {
  const response = await fetch(`/api/ideas/${ideaId}/history`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch version history");
  }

  return response.json();
}
