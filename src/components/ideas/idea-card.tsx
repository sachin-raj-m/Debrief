"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import { useVote, useRemoveVote } from "@/hooks/use-votes";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MessageSquare, TrendingUp, Clock } from "lucide-react";

interface IdeaCardProps {
    idea: {
        id: string;
        title: string;
        description: string;
        created_at: string;
        user_id: string;
        author?: {
            full_name: string | null;
            avatar_url?: string | null;
        } | null;
        upvotes_count?: number;
        downvotes_count?: number;
        comments_count?: number;
        user_vote?: {
            value: number;
        } | null;
    };
    variant?: "default" | "mint" | "coral" | "lime" | "glass";
}

export function IdeaCard({ idea, variant = "glass" }: IdeaCardProps) {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { mutate: vote, isPending: isVoting } = useVote(idea.id);
    const { mutate: removeVote, isPending: isRemoving } = useRemoveVote(idea.id);

    const userVote = idea.user_vote?.value;
    const netVotes = (idea.upvotes_count ?? 0) - (idea.downvotes_count ?? 0);
    const isPositive = netVotes > 0;

    const handleVote = (e: React.MouseEvent, value: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();

        if (authLoading) return;

        if (!isAuthenticated) {
            toast.info("Please sign in to vote");
            router.push(`/login?redirectTo=/ideas/${idea.id}`);
            return;
        }

        if (userVote === value) {
            removeVote();
        } else {
            vote(value);
        }
    };

    return (
        <Link href={`/ideas/${idea.id}`} className="group block h-full">
            <Card variant="glass-shimmer" className="relative h-full flex flex-col transition-all duration-500 hover:-translate-y-1">

                {/* Ambient Glow Effects */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7877c6]/10 blur-[80px] transition-all duration-700 group-hover:bg-[#7877c6]/20" />

                {/* Content Container */}
                <div className="relative z-10 flex flex-1 flex-col p-5 md:p-8">

                    {/* Header: Author & Status */}
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                                <AvatarImage src={idea.author?.avatar_url || undefined} className="object-cover" />
                                <AvatarFallback className="bg-white/5 text-xs text-muted-foreground">{getInitials(idea.author?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground/90 line-clamp-1">{idea.author?.full_name || "Anonymous"}</span>
                                <span className="text-xs text-muted-foreground">{formatDistanceToNow(idea.created_at)} ago</span>
                            </div>
                        </div>

                        {/* Status Badge (Mocking 'New' or 'Trending' logic for visual) */}
                        <div className="flex gap-2">
                            {(netVotes > 5) && (
                                <Badge variant="default" className="gap-1.5 px-3 py-1 rounded-full bg-[#7877c6]/10 text-[#7877c6] border border-[#7877c6]/20 backdrop-blur-md">
                                    <TrendingUp className="h-3 w-3" />
                                    Trending
                                </Badge>
                            )}
                            {!isPositive && (
                                <Badge variant="glass" className="gap-1.5 px-3 py-1 rounded-full text-muted-foreground bg-white/5 border-white/5 shadow-none">
                                    <Clock className="h-3 w-3" />
                                    New
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Body: Title & Excerpt */}
                    <div className="flex-1 space-y-3">
                        <h3 className="font-heading text-xl md:text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                            {idea.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground/90 transition-colors">
                            {idea.description}
                        </p>
                    </div>

                </div>

                {/* Footer: Stats & Actions */}
                <div className="relative z-10 mt-auto border-t border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors group-hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">

                        {/* Vote Controls */}
                        <div className="flex items-center gap-1 rounded-full bg-black/20 p-1 ring-1 ring-white/5 backdrop-blur-md">
                            <button
                                onClick={(e) => handleVote(e, 1)}
                                disabled={isVoting || isRemoving || authLoading}
                                className={cn(
                                    "flex h-8 w-10 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50",
                                    userVote === 1
                                        ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <ArrowUpRight className="h-4 w-4 -rotate-45" />
                            </button>

                            <span className={cn(
                                "min-w-[1.5rem] text-center text-sm font-bold tabular-nums",
                                netVotes > 0 ? "text-emerald-400" : netVotes < 0 ? "text-rose-400" : "text-muted-foreground"
                            )}>
                                {netVotes > 0 ? `+${netVotes}` : netVotes}
                            </span>

                            <button
                                onClick={(e) => handleVote(e, -1)}
                                disabled={isVoting || isRemoving || authLoading}
                                className={cn(
                                    "flex h-8 w-10 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50",
                                    userVote === -1
                                        ? "bg-rose-500/20 text-rose-400 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <ArrowUpRight className={cn("h-4 w-4 rotate-135")} />
                            </button>
                        </div>

                        {/* Comments & Action */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <MessageSquare className="h-4 w-4 opacity-70" />
                                <span>{idea.comments_count || 0}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                                View
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                        </div>

                    </div>
                </div>
            </Card>
        </Link>
    );
}

// Helper for variant classes kept for compatibility but not used
function getVariantClasses(variant: string) {
    return "";
}
