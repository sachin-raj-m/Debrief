/**
 * Base API Client
 * 
 * Standardized wrapper around fetch for client-side API calls.
 */

type RequestConfig = RequestInit & {
    params?: Record<string, string | number | boolean | undefined>;
};

interface ApiResponse<T = unknown> {
    data?: T;
    error?: {
        message: string;
        code?: string;
        [key: string]: unknown;
    };
    meta?: unknown;
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const { params, headers, ...customConfig } = config;

    // Build URL with params
    const url = new URL(endpoint, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    try {
        const response = await fetch(url.toString(), {
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            ...customConfig,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: {
                    message: data.message || "An error occurred",
                    code: data.error,
                    ...data
                }
            };
        }

        return { data };
    } catch (error) {
        return {
            error: {
                message: error instanceof Error ? error.message : "Network error",
                code: "NETWORK_ERROR",
            },
        };
    }
}

export const apiClient = {
    get: <T>(endpoint: string, config?: RequestConfig) =>
        request<T>(endpoint, { ...config, method: "GET" }),

    post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        request<T>(endpoint, { ...config, method: "POST", body: JSON.stringify(data) }),

    put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        request<T>(endpoint, { ...config, method: "PUT", body: JSON.stringify(data) }),

    delete: <T>(endpoint: string, config?: RequestConfig) =>
        request<T>(endpoint, { ...config, method: "DELETE" }),
};
