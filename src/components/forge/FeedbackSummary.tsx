"use client";

import { useIdeaFeedback } from "@/hooks/use-forge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp, Users } from "lucide-react";

interface FeedbackSummaryProps {
    ideaId: string;
}

export function FeedbackSummary({ ideaId }: FeedbackSummaryProps) {
    const { data: feedbackData, isLoading } = useIdeaFeedback(ideaId);
    const feedbacks = feedbackData?.data || [];

    if (isLoading) {
        return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
    }

    if (feedbacks.length === 0) {
        return (
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-6 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No feedback received yet. Share your journey to get insights!</p>
                </CardContent>
            </Card>
        );
    }

    // specific stats
    const totalReviews = feedbacks.length;
    const ratings = feedbacks.filter(f => f.ratings?.overall).map(f => f.ratings.overall);
    const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "N/A";

    const uniquePeers = new Set(feedbacks.map(f => f.user_id)).size;

    return (
        <div className="space-y-6 mb-8">
            <h3 className="font-display text-xl font-bold">Feedback Report</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgRating}</div>
                        <p className="text-xs text-muted-foreground">out of 5.0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalReviews}</div>
                        <p className="text-xs text-muted-foreground">across all levels</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contributors</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniquePeers}</div>
                        <p className="text-xs text-muted-foreground">unique peers</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        AI Summary (Simulated)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Based on the feedback, your idea has strong **Problem Clarity** (Level 1) but peers are skeptical about the **Revenue Model** (Level 4). Consider exploring B2B alternatives suggested in Level 2 feedback.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
