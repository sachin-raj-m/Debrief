"use client";

import { useIdeaBackers } from "@/hooks/use-social-validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp } from "lucide-react";

interface ValuationCardProps {
    ideaId: string;
}

export function ValuationCard({ ideaId }: ValuationCardProps) {
    const { data: backersData, isLoading } = useIdeaBackers(ideaId);

    if (isLoading) {
        return (
            <Card className="w-full animate-pulse h-48 bg-muted/50" />
        );
    }

    const { meta, data: backers } = backersData || { meta: { total_pledged: 0, backers_count: 0 }, data: [] };

    // Format currency
    const formattedValuation = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(meta.total_pledged);

    return (
        <Card className="w-full border-mint-500/20 bg-mint-50/50 dark:bg-mint-950/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-mint-500" />
                    Implied Valuation (Demand)
                </CardTitle>
                <div className="text-4xl font-bold text-foreground font-display">
                    {formattedValuation}
                </div>
                <p className="text-xs text-muted-foreground">
                    Based on {meta.backers_count} backers pledging non-binding support.
                </p>
            </CardHeader>
            <CardContent>
                <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Recent Backers
                    </h4>
                    {backers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Be the first to back this idea!</p>
                    ) : (
                        <div className="space-y-3">
                            {backers.slice(0, 5).map((backer) => (
                                <div key={backer.id} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={backer.is_anonymous ? undefined : backer.user?.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {backer.is_anonymous ? "?" : backer.user?.full_name?.[0] || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium truncate">
                                                {backer.is_anonymous ? "Anonymous Backer" : backer.user?.full_name || "User"}
                                            </p>
                                            <span className="text-sm font-semibold text-mint-600 dark:text-mint-400">
                                                ₹{backer.pledge_amount}
                                            </span>
                                        </div>
                                        {backer.comment && (
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                "{backer.comment}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
