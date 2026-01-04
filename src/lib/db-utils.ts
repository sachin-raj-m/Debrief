import { SupabaseClient } from "@supabase/supabase-js";

interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export const UnknownProfile: Profile = {
    id: "unknown",
    full_name: "Unknown User",
    avatar_url: null,
};

/**
 * Enriches a list of items with author profiles by fetching them efficiently.
 * @param items Array of items containing a `user_id` field.
 * @param supabase Supabase client instance.
 * @returns Array of items with an injected `author` property.
 */
export async function enrichWithProfiles<T extends { user_id: string }>(
    items: T[],
    supabase: SupabaseClient
): Promise<(T & { author: Profile })[]> {
    if (items.length === 0) return [];

    const userIds = [...new Set(items.map((item) => item.user_id))];

    const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

    const profilesMap: Record<string, Profile> = {};

    if (profilesData) {
        profilesData.forEach((p: any) => {
            profilesMap[p.id] = p;
        });
    }

    return items.map((item) => ({
        ...item,
        author: profilesMap[item.user_id] || { ...UnknownProfile, id: item.user_id },
    }));
}

/**
 * Enriches a single item with author profile.
 * @param item Item containing a `user_id` field.
 * @param supabase Supabase client instance.
 * @returns Item with an injected `author` property.
 */
export async function enrichOneWithProfile<T extends { user_id: string }>(
    item: T | null,
    supabase: SupabaseClient
): Promise<(T & { author: Profile }) | null> {
    if (!item) return null;
    const [enriched] = await enrichWithProfiles([item], supabase);
    return enriched;
}
