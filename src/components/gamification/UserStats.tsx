"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, MessageSquare } from "lucide-react";

interface UserStatsProps {
    userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
    const supabase = createClient();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["user_stats", userId],
        queryFn: async () => {
            const [profileResult, ideasResult, feedbackResult] = await Promise.all([
                supabase.from("profiles").select("karma").eq("id", userId).single(),
                supabase.from("ideas").select("*", { count: "exact", head: true }).eq("user_id", userId),
                supabase.from("idea_feedback").select("*", { count: "exact", head: true }).eq("user_id", userId)
            ]);

            return {
                karma: profileResult.data?.karma || 0,
                ideas: ideasResult.count || 0,
                feedback: feedbackResult.count || 0,
            };
        },
        enabled: !!userId,
    });

    if (isLoading) {
        return <div className="grid grid-cols-3 gap-4 animate-pulse">
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
        </div>;
    }

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Zap className="h-6 w-6 text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">{stats?.karma}</div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Karma</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Target className="h-6 w-6 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{stats?.ideas}</div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ideas</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <MessageSquare className="h-6 w-6 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{stats?.feedback}</div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Feedback</p>
                </CardContent>
            </Card>
        </div>
    );
}
