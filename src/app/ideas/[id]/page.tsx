/**
 * Idea Detail Page
 * 
 * Shows full idea with comments.
 */

"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdea, useVote, useRemoveVote, useComments, useCreateComment, useAuth } from "@/hooks";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

interface IdeaPageProps {
    params: Promise<{ id: string }>;
}

export default function IdeaPage({ params }: IdeaPageProps) {
    const { id } = use(params);

    // Redirect if ID is invalid
    if (!id || id === "undefined") {
        return (
            <>
                <Header />
                <main className="mx-auto max-w-7xl px-6 py-8">
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
                <main className="mx-auto max-w-7xl px-6 py-8">
                    <IdeaDetailSkeleton />
                </main>
            </>
        );
    }

    if (isError || !data) {
        return (
            <>
                <Header />
                <main className="mx-auto max-w-7xl px-6 py-8">
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
            <main className="mx-auto max-w-7xl px-6 py-8 min-h-[calc(100vh-4rem)]">
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

import { JourneyStepper } from "@/components/forge/JourneyStepper";
import { Level1Form } from "@/components/forge/Level1Form";
import { useIdeaLevels } from "@/hooks/use-forge";
import { cn } from "@/lib/utils";

import { LevelUpModal } from "@/components/forge/LevelUpModal";
import { Level2Form } from "@/components/forge/Level2Form";
import { Level3Form } from "@/components/forge/Level3Form";
import { Level4Form } from "@/components/forge/Level4Form";
import { Level5Form } from "@/components/forge/Level5Form";

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
    const [activeTab, setActiveTab] = useState<"description" | "journey">("description");

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
        <article className="mb-8 overflow-hidden rounded-[2.5rem] bg-card shadow-sm border border-border">
            {/* Header Section */}
            <div className="p-8 md:p-12 pb-0">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-border">
                            <AvatarImage src={idea.author?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(idea.author?.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{idea.author?.full_name || "Anonymous"}</span>
                            <span className="text-sm text-muted-foreground">{formatDistanceToNow(idea.created_at)}</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            const url = `${window.location.origin}/share/${idea.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Public link copied!");
                        }}
                    >
                        <Share2 className="h-4 w-4" />
                        Share Journey
                    </Button>
                </div>

                <h1 className="mb-4 font-display text-3xl md:text-4xl font-bold leading-tight text-foreground tracking-tight">{idea.title}</h1>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-6 border-b border-border mt-8">
                    <button
                        onClick={() => setActiveTab("description")}
                        className={cn(
                            "pb-4 text-sm font-medium transition-colors relative",
                            activeTab === "description" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Description
                        {activeTab === "description" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("journey")}
                        className={cn(
                            "pb-4 text-sm font-medium transition-colors relative",
                            activeTab === "journey" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        The Journey
                        {activeTab === "journey" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 md:p-12 pt-8">
                {activeTab === "description" ? (
                    <>
                        <p className="mb-8 text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{idea.description}</p>

                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                            <div className="flex items-center gap-2 rounded-full border border-border bg-background/50 p-1.5 shadow-sm">
                                <button
                                    onClick={() => handleVote(1)}
                                    disabled={isVoting || isRemoving || authLoading}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${userVote === 1 ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "text-muted-foreground"}`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={userVote === 1 ? "fill-current" : ""}>
                                        <path d="M18 15l-6-6-6 6" />
                                    </svg>
                                    <span>{idea.upvotes_count ?? 0}</span>
                                </button>

                                <span className="min-w-[2rem] text-center font-bold text-foreground">{netVotes > 0 ? `+${netVotes}` : netVotes}</span>

                                <button
                                    onClick={() => handleVote(-1)}
                                    disabled={isVoting || isRemoving || authLoading}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted ${userVote === -1 ? "bg-red-500/10 text-red-600 hover:bg-red-500/20" : "text-muted-foreground"}`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={userVote === -1 ? "fill-current" : ""}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                    <span>{idea.downvotes_count ?? 0}</span>
                                </button>
                            </div>

                            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {idea.comments_count ?? 0} comments
                            </span>
                        </div>
                    </>
                ) : (
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
                                    isOwner={user?.id === idea.user_id}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 2 && (
                                <Level2Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 2)}
                                    isLocked={currentLevel < 1}
                                    isOwner={user?.id === idea.user_id}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 3 && (
                                <Level3Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 3)}
                                    isLocked={currentLevel < 2}
                                    isOwner={user?.id === idea.user_id}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 4 && (
                                <Level4Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 4)}
                                    isLocked={currentLevel < 3}
                                    isOwner={user?.id === idea.user_id}
                                    isAuthenticated={isAuthenticated}
                                />
                            )}

                            {selectedLevel === 5 && (
                                <Level5Form
                                    ideaId={idea.id}
                                    levelData={levels?.data?.find(l => l.level_number === 5)}
                                    isLocked={currentLevel < 4}
                                    isOwner={user?.id === idea.user_id}
                                />
                            )}
                        </div>
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
        <section className="max-w-3xl mx-auto">
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
        <div className="mb-8 overflow-hidden rounded-[2.5rem] bg-card p-8 md:p-12 shadow-sm border border-border">
            <div className="mb-6 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <Skeleton className="mb-4 h-10 w-3/4" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-8 h-4 w-2/3" />

            <div className="border-t border-border pt-6">
                <Skeleton className="h-10 w-48 rounded-full" />
            </div>
        </div>
    );
}
