"use client";

import { useIdeaBackers } from "@/hooks/use-social-validation";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValuationCardProps {
    ideaId: string;
}

export function ValuationCard({ ideaId }: ValuationCardProps) {
    const { data: backersData, isLoading, isError } = useIdeaBackers(ideaId);

    if (isLoading) {
        return (
            <div className="w-full animate-pulse h-48 rounded-3xl bg-white/5 border border-white/5" />
        );
    }

    if (isError || !backersData) {
        return (
            <div className="w-full h-48 rounded-3xl bg-[#09090b] border border-white/5 flex flex-col items-center justify-center p-6 text-center">
                <DollarSign className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">Unable to load valuation data</p>
            </div>
        );
    }

    const { meta, data: backers } = backersData;

    // Format currency
    const formattedValuation = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(meta?.total_pledged || 0);

    return (
        <Card variant="glass-shimmer" className="relative w-full overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7877c6]/10 blur-[80px]" />

            <div className="relative z-10 p-6 md:p-8">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Implied Valuation</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                            {formattedValuation}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                            (Demand)
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground/60">
                        Based on {meta?.backers_count || 0} backers pledging non-binding support.
                    </p>
                </div>

                {/* Backers List Section */}
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Recent Backers
                    </h4>

                    {!backers || backers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/2 p-4 text-center">
                            <p className="text-sm italic text-muted-foreground">Be the first to back this idea!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {backers.slice(0, 5).map((backer) => (
                                <div
                                    key={backer.id}
                                    className="group flex items-center gap-3 rounded-xl border border-transparent bg-white/2 p-2 transition-all hover:bg-white/5 hover:border-white/5"
                                >
                                    <Avatar className="h-8 w-8 ring-1 ring-white/10">
                                        <AvatarImage src={backer.is_anonymous ? undefined : backer.user?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-white/5 text-[10px] text-muted-foreground">
                                            {backer.is_anonymous ? "?" : backer.user?.full_name?.[0] || "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
                                                {backer.is_anonymous ? "Anonymous Backer" : backer.user?.full_name || "User"}
                                            </p>
                                            <span className="shrink-0 rounded-md bg-[#7877c6]/10 px-2 py-0.5 text-xs font-bold text-[#fafafa] border border-[#7877c6]/20">
                                                ₹{backer.pledge_amount.toLocaleString()}
                                            </span>
                                        </div>
                                        {backer.comment && (
                                            <p className="truncate text-xs text-muted-foreground/60 italic max-w-[200px]">
                                                "{backer.comment}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
