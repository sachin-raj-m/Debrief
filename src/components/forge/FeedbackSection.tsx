"use client";

import { useState } from "react";
import { useIdeaFeedback, usePostIdeaFeedback } from "@/hooks/use-forge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDistanceToNow } from "@/lib/utils";
import { MessageSquare, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackSectionProps {
    ideaId: string;
    levelNumber: number;
    isOwner: boolean;
    isAuthenticated: boolean;
}

export function FeedbackSection({ ideaId, levelNumber, isOwner, isAuthenticated }: FeedbackSectionProps) {
    const { data: feedbackData, isLoading } = useIdeaFeedback(ideaId, levelNumber);
    const { mutate: postFeedback, isPending } = usePostIdeaFeedback(ideaId);

    const [content, setContent] = useState("");
    const [rating, setRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        postFeedback(
            { levelNumber, content, ratings: { overall: rating } },
            {
                onSuccess: () => {
                    setContent("");
                    setRating(0);
                },
            }
        );
    };

    const feedbacks = feedbackData?.data || [];

    return (
        <div className="mt-12 space-y-8 border-t border-border pt-8">
            <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Peer Feedback
                </h3>
                <span className="text-sm text-muted-foreground">{feedbacks.length} reviews</span>
            </div>

            {/* Feedback Form (Only for non-owners) */}
            {!isOwner && isAuthenticated && (
                <form onSubmit={handleSubmit} className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Rate this level:</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={cn(
                                        "transition-colors",
                                        rating >= star ? "text-yellow-500 fill-current" : "text-muted-foreground"
                                    )}
                                >
                                    <Star className={cn("h-5 w-5", rating >= star && "fill-current")} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Is this clear? specific? realistic? Give constructive feedback..."
                        className="bg-background min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" variant="mint" disabled={isPending || !content.trim()}>
                            {isPending ? "Posting..." : "Post Feedback"}
                            <Send className="ml-2 h-3 w-3" />
                        </Button>
                    </div>
                </form>
            )}

            {/* List */}
            <div className="space-y-6">
                {feedbacks.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">No feedback yet. Be the first!</p>
                ) : (
                    feedbacks.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={item.author?.avatar_url ?? undefined} />
                                <AvatarFallback>{getInitials(item.author?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{item.author?.full_name || "Peer"}</span>
                                        <span className="text-xs text-muted-foreground">• {formatDistanceToNow(item.created_at)}</span>
                                    </div>
                                    {item.ratings?.overall && (
                                        <div className="flex items-center gap-0.5 text-yellow-500">
                                            <span className="text-sm font-bold">{item.ratings.overall}</span>
                                            <Star className="h-3 w-3 fill-current" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed">{item.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
