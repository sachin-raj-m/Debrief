"use client";

import { use, useEffect, useState } from "react";
import { useIdea } from "@/hooks/use-ideas";
import { PublicJourneyTimeline } from "@/components/forge/PublicJourneyTimeline";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Since this is a public page, we might ideally fetch on server, but sticking to existing pattern for now.
// We need to fetch idea details. reusing useIdea hook if it works for public.
// Wait, useIdea usually uses supabase client which handles auth. If RLS policies allowed public select, it should work.


interface SharePageProps {
    params: Promise<{ id: string }>;
}

export default function SharePage({ params }: SharePageProps) {
    const { id } = use(params);
    const { data, isLoading } = useIdea(id);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="mx-auto max-w-4xl px-6 py-12">
                    <div className="animate-pulse space-y-8">
                        <div className="h-12 w-3/4 bg-muted rounded-xl" />
                        <div className="h-96 w-full bg-muted rounded-xl" />
                    </div>
                </main>
            </div>
        );
    }

    if (!data?.data) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="mx-auto max-w-4xl px-6 py-12 text-center">
                    <h1 className="text-2xl font-bold">Idea Not Found</h1>
                    <p className="text-muted-foreground mt-2">This journey might be private or deleted.</p>
                </main>
            </div>
        );
    }

    const idea = data.data;

    return (
        <div className="min-h-screen bg-background selection:bg-primary/10">
            <Header />

            <main className="mx-auto max-w-4xl px-6 py-12">
                {/* Header Actions */}
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>

                {/* Idea Header */}
                <div className="space-y-6 mb-12 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 backdrop-blur-sm">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={idea.author?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(idea.author?.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{idea.author?.full_name || "Anonymous"}'s Journey</span>
                    </div>

                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        {idea.title}
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
                        {idea.description}
                    </p>
                </div>

                {/* The Timeline */}
                <div className="rounded-[2.5rem] border border-border bg-card p-8 md:p-12 shadow-sm">
                    <h2 className="font-display text-2xl font-bold mb-8">Validation Journey</h2>
                    <PublicJourneyTimeline ideaId={id} currentLevel={idea.current_level} />
                </div>

                {/* Footer CTA */}
                <div className="mt-16 text-center space-y-4">
                    <p className="text-muted-foreground">Inspired by this journey?</p>
                    <Button variant="mint" size="lg" className="rounded-full px-8" asChild>
                        <Link href="/">Start Your Own Forge</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
