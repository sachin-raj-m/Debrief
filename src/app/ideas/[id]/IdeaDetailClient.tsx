"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdea, useVote, useRemoveVote, useComments, useCreateComment, useAuth } from "@/hooks";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { JourneyStepper } from "@/components/forge/JourneyStepper";
import { Level1Form } from "@/components/forge/Level1Form";
import { useIdeaLevels } from "@/hooks/use-forge";
import { cn } from "@/lib/utils";

import { LevelUpModal } from "@/components/forge/LevelUpModal";
import { Level2Form } from "@/components/forge/Level2Form";
import { Level3Form } from "@/components/forge/Level3Form";
import { Level4Form } from "@/components/forge/Level4Form";
import { Level5Form } from "@/components/forge/Level5Form";
import { BackingDialog } from "@/components/social/BackingDialog";
import { ValuationCard } from "@/components/social/ValuationCard";
import { PivotDialog, PivotTimeline } from "@/components/pivot";
import { CollaboratorSettings } from "@/components/collaboration";
import { useCollaboratorRole } from "@/hooks/use-collaborators";

interface IdeaDetailClientProps {
    id: string;
}

export default function IdeaDetailClient({ id }: IdeaDetailClientProps) {

    // Redirect if ID is invalid
    if (!id || id === "undefined") {
        return (
            <>
                <Header />
                <main className="mx-auto max-w-7xl px-6 pt-32 pb-8">
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/50 p-12 text-center">
                        <p className="font-display text-xl font-semibold text-foreground">Invalid idea</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            This link appears to be broken.
                        </p>
                        <Button variant="mint" size="pill" asChild className="mt-6">
                            <a href="/">Go home</a>
                        </Button>
                    </div>
                </main>
            </>
        );
    }

    return <IdeaPageContent id={id} />;
}

function IdeaPageContent({ id }: { id: string }) {
    const { data, isLoading, isError, error } = useIdea(id);
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="mx-auto w-full max-w-[1600px] px-4 md:px-8 pt-32 pb-8 min-h-[calc(100vh-4rem)]">
                    <IdeaDetailSkeleton />
                </main>
            </>
        );
    }

    if (isError || !data) {
        return (
            <>
                <Header />
                <main className="mx-auto w-full max-w-[1600px] px-4 md:px-8 pt-32 pb-8">
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-card/50 p-12 text-center">
                        <p className="font-display text-xl font-semibold text-foreground">Idea not found</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {error?.message || "This idea may have been deleted."}
                        </p>
                        <Button variant="mint" size="pill" asChild className="mt-6">
                            <a href="/">Go home</a>
                        </Button>
                    </div>
                </main>
            </>
        );
    }

    const idea = data.data;

    return (
        <>
            <Header />
            <main className="mx-auto w-full max-w-[1600px] px-4 md:px-8 pt-32 pb-8 min-h-[calc(100vh-4rem)]">
                <IdeaDetail
                    idea={idea}
                    user={user}
                    isAuthenticated={isAuthenticated}
                    authLoading={authLoading}
                />
                <CommentsSection
                    ideaId={id}
                    isAuthenticated={isAuthenticated}
                    authLoading={authLoading}
                />
            </main>
        </>
    );
}

function IdeaDetail({
    idea,
    user,
    isAuthenticated,
    authLoading,
}: {
    idea: any;
    user: any;
    isAuthenticated: boolean;
    authLoading: boolean;
}) {
    const router = useRouter();
    const { mutate: vote, isPending: isVoting } = useVote(idea.id);
    const { mutate: removeVote, isPending: isRemoving } = useRemoveVote(idea.id);
    const { data: levels } = useIdeaLevels(idea.id);
    const [activeTab, setActiveTab] = useState<"journey" | "history" | "team">("journey");

    // Ownership and collaboration permissions
    const isOwner = isAuthenticated && user?.id === idea.user_id;
    const { canEdit, canManage, isCollaborator } = useCollaboratorRole(idea.id, user?.id, isOwner);

    const currentLevel = idea.current_level || 0;

    // Default to current level
    const [selectedLevel, setSelectedLevel] = useState(currentLevel);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [prevLevel, setPrevLevel] = useState(currentLevel);

    // Update selected level if currentLevel changes (e.g. after completing a level)
    useEffect(() => {
        if (currentLevel > prevLevel) {
            setShowLevelUp(true);
            setSelectedLevel(currentLevel);
            setPrevLevel(currentLevel);
        } else if (currentLevel !== prevLevel) {
            // Just sync if it went down (unlikely) or init
            setSelectedLevel(currentLevel);
            setPrevLevel(currentLevel);
        }
    }, [currentLevel, prevLevel]);

    const userVote = idea.user_vote?.value;
    const netVotes = (idea.upvotes_count ?? 0) - (idea.downvotes_count ?? 0);

    const handleVote = (value: 1 | -1) => {
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
        <article className="group relative mb-8 overflow-hidden rounded-[2.5rem] bg-[#09090b]/80 border border-white/5 shadow-2xl backdrop-blur-md transition-all">
            {/* Ambient Background Glow */}
            <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#7877c6]/10 blur-[120px] pointer-events-none" />

            {/* Header Section */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 pb-0">
                {/* Author & Actions Row */}
                <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar className="h-10 w-10 sm:h-12 md:h-14 sm:w-12 md:w-14 border-2 border-white/10 shadow-md shrink-0">
                            <AvatarImage src={idea.author?.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/10 text-foreground text-sm sm:text-base">{getInitials(idea.author?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">{idea.author?.full_name || "Anonymous"}</span>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{formatDistanceToNow(idea.created_at)}</span>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-[1fr_auto] sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {canEdit && (
                            <PivotDialog
                                ideaId={idea.id}
                                currentTitle={idea.title}
                                currentDescription={idea.description}
                            />
                        )}
                        <BackingDialog ideaId={idea.id} />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 h-10 w-10 sm:w-auto sm:px-4 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all text-sm justify-center"
                            onClick={() => {
                                const url = `${window.location.origin}/share/${idea.id}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Public link copied!");
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                    </div>
                </div>

                {/* Title & Valuation Card Grid */}
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_300px]">
                    <div>
                        <h1 className="mb-4 md:mb-6 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-foreground tracking-tight drop-shadow-sm">{idea.title}</h1>

                        {/* Description */}
                        <p className="mb-6 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>

                        {/* Voting & Comments */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-border bg-background/50 p-1 sm:p-1.5 shadow-sm">
                                <button
                                    onClick={() => handleVote(1)}
                                    disabled={isVoting || isRemoving || authLoading}
                                    className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-9 sm:h-9 transition-colors hover:bg-muted ${userVote === 1 ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "text-muted-foreground"}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={userVote === 1 ? "fill-current" : ""}>
                                        <path d="M18 15l-6-6-6 6" />
                                    </svg>
                                </button>

                                <span className="min-w-6 sm:min-w-8 text-center text-sm sm:text-base font-bold text-foreground">{netVotes > 0 ? `+${netVotes}` : netVotes}</span>

                                <button
                                    onClick={() => handleVote(-1)}
                                    disabled={isVoting || isRemoving || authLoading}
                                    className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-9 sm:h-9 transition-colors hover:bg-muted ${userVote === -1 ? "bg-red-500/10 text-red-600 hover:bg-red-500/20" : "text-muted-foreground"}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={userVote === -1 ? "fill-current" : ""}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            </div>

                            <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {idea.comments_count ?? 0} comments
                            </span>
                        </div>
                    </div>
                    <div className="lg:pt-2">
                        <ValuationCard ideaId={idea.id} />
                    </div>
                </div>

                {/* Tabs Navigation - Horizontal scrollable on mobile */}
                <div className="-mx-4 sm:mx-0 mt-8 md:mt-12 border-b border-white/10">
                    <div className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide px-4 sm:px-2">
                        {["journey", "history", ...(isOwner || isCollaborator ? ["team"] : [])].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "pb-3 md:pb-4 text-xs sm:text-sm font-bold tracking-wide uppercase transition-all relative whitespace-nowrap shrink-0",
                                    activeTab === tab ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground/80"
                                )}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 pt-6 md:pt-8">
                {activeTab === "journey" ? (
                    <div className="space-y-8">
                        <JourneyStepper
                            currentLevel={currentLevel}
                            selectedLevel={selectedLevel}
                            onSelectLevel={setSelectedLevel}
                        />

                        <div className="mt-8 rounded-2xl bg-muted/30 p-6 border border-border/50">
                            {selectedLevel === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    <h3 className="text-xl font-semibold text-foreground mb-2">The Spark</h3>
                                    <p>The initial concept. See the Description tab for details.</p>
                                </div>
                            )}

                            {selectedLevel === 1 && (
                                <Level1Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 1)}
                                    isLocked={currentLevel < 0} // Always unlocked basically
                                    isOwner={canEdit}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 2 && (
                                <Level2Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 2)}
                                    isLocked={currentLevel < 1}
                                    isOwner={canEdit}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 3 && (
                                <Level3Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 3)}
                                    isLocked={currentLevel < 2}
                                    isOwner={canEdit}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 4 && (
                                <Level4Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 4)}
                                    isLocked={currentLevel < 3}
                                    isOwner={canEdit}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 5 && (
                                <Level5Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 5)}
                                    isLocked={currentLevel < 4}
                                    isOwner={canEdit}
                                />
                            )}
                        </div>
                    </div>
                ) : activeTab === "history" ? (
                    <div className="space-y-6">
                        <PivotTimeline ideaId={idea.id} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <CollaboratorSettings
                            ideaId={idea.id}
                            isOwner={canManage}
                            currentUserId={user?.id}
                        />
                    </div>
                )}

                <LevelUpModal
                    isOpen={showLevelUp}
                    onClose={() => setShowLevelUp(false)}
                    level={currentLevel}
                />
            </div>
        </article>
    );
}

function CommentsSection({
    ideaId,
    isAuthenticated,
    authLoading
}: {
    ideaId: string;
    isAuthenticated: boolean;
    authLoading: boolean;
}) {
    const router = useRouter();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useComments(ideaId);
    const { mutate: createComment, isPending: isCreating } = useCreateComment(ideaId);
    const [content, setContent] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        if (!isAuthenticated) {
            toast.info("Please sign in to comment");
            router.push(`/login?redirectTo=/ideas/${ideaId}`);
            return;
        }

        createComment(
            { content: content.trim() },
            {
                onSuccess: () => {
                    setContent("");
                    toast.success("Comment added!");
                },
            }
        );
    };

    const comments = data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <section className="max-w-5xl mx-auto mt-12">
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Comments</h2>

            <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isAuthenticated ? "Write a comment..." : "Sign in to comment..."}
                    className="flex h-12 flex-1 rounded-full border border-input bg-background px-6 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isCreating || authLoading}
                />
                <Button
                    type="submit"
                    variant="mint"
                    size="pill"
                    disabled={isCreating || !content.trim() || authLoading}
                    className="h-12 px-8"
                >
                    {isCreating ? "..." : "Post"}
                </Button>
            </form>

            {isLoading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {comments.map((comment) => (
                        <div key={comment.id} className="group flex gap-4">
                            <Avatar className="h-10 w-10 border border-border mt-1">
                                <AvatarImage src={comment.author?.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(comment.author?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="font-semibold text-foreground text-sm">{comment.author?.full_name || "Anonymous"}</span>
                                    <span className="text-xs text-muted-foreground">• {formatDistanceToNow(comment.created_at)}</span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))}

                    {hasNextPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full text-muted-foreground hover:text-foreground"
                        >
                            {isFetchingNextPage ? "Loading..." : "Load more comments"}
                        </Button>
                    )}
                </div>
            )}
        </section>
    );
}

function IdeaDetailSkeleton() {
    return (
        <article className="group relative mb-8 overflow-hidden rounded-[2.5rem] bg-[#09090b]/80 border border-white/5 shadow-2xl backdrop-blur-md">
            {/* Header Section */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 pb-0">
                {/* Author & Actions Row */}
                <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Skeleton className="h-10 w-10 sm:h-12 md:h-14 sm:w-12 md:w-14 rounded-full" />
                        <div className="flex flex-col gap-1.5">
                            <Skeleton className="h-5 w-32 sm:w-40" />
                            <Skeleton className="h-4 w-20 sm:w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Skeleton className="h-10 sm:h-11 flex-1 sm:flex-initial sm:w-36 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </div>

                {/* Title & Valuation Grid */}
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr_300px]">
                    <div>
                        {/* Title */}
                        <Skeleton className="mb-4 md:mb-6 h-8 sm:h-10 md:h-12 lg:h-14 w-full sm:w-4/5" />

                        {/* Description */}
                        <div className="space-y-2 mb-6">
                            <Skeleton className="h-4 sm:h-5 w-full" />
                            <Skeleton className="h-4 sm:h-5 w-full" />
                            <Skeleton className="h-4 sm:h-5 w-3/4" />
                        </div>

                        {/* Voting & Comments */}
                        <div className="flex flex-wrap items-center gap-4">
                            <Skeleton className="h-10 w-24 sm:w-28 rounded-full" />
                            <Skeleton className="h-5 w-24 sm:w-28" />
                        </div>
                    </div>

                    {/* ValuationCard Skeleton */}
                    <div className="lg:pt-2">
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-3">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-28 sm:w-32" />
                            </div>
                            <Skeleton className="mb-1 h-8 sm:h-10 w-16 sm:w-20" />
                            <Skeleton className="mb-4 h-3 w-32 sm:w-48" />
                            <div className="flex items-center gap-2 mb-3">
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-4 w-24 sm:w-28" />
                            </div>
                            <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="-mx-4 sm:mx-0 mt-8 md:mt-12 border-b border-white/10">
                    <div className="flex items-center gap-4 sm:gap-6 md:gap-8 px-4 sm:px-2">
                        <Skeleton className="h-8 w-16 sm:w-20" />
                        <Skeleton className="h-8 w-16 sm:w-20" />
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-12 pt-6 md:pt-8">
                <div className="space-y-4">
                    <Skeleton className="h-16 sm:h-20 w-full rounded-xl" />
                    <Skeleton className="h-16 sm:h-20 w-full rounded-xl" />
                </div>
            </div>
        </article>
    );
}
