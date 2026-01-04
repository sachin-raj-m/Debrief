"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Hammer, TrendingUp, Users, LucideIcon } from "lucide-react";

type NudgeType = "desirability" | "feasibility" | "viability";

interface ForgeNudgeProps {
    type: NudgeType;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const config: Record<NudgeType, {
    icon: LucideIcon;
    colorClasses: string;
    iconBgClasses: string;
}> = {
    desirability: {
        icon: Users, // Or Sparkles, depending on context. Defaulting to Users/Sparkles composite? Let's use Sparkles for general desirability or Users for specific.
        // Update: Level 1 used Sparkles, Level 2 used Users. 
        // I'll make the icon configurable or stick to a distinct one per type. 
        // Let's use Sparkles as the generic "Desirability" icon for uniformity, or allow overriding.
        colorClasses: "border-coral text-coral",
        iconBgClasses: "bg-coral/10 text-coral",
    },
    feasibility: {
        icon: Hammer,
        colorClasses: "border-lime text-lime-foreground", // Lime might be light, so foreground for text?
        // Actually lime-foreground is 0a0a0a (dark).
        // Let's try to keep it readable. text-lime might be too bright on light mode?
        // Let's use specific hardcoded tailwind colors if unsure, but let's try custom first.
        iconBgClasses: "bg-lime/20 text-lime-700 dark:text-lime",
    },
    viability: {
        icon: TrendingUp,
        colorClasses: "border-mint text-mint",
        iconBgClasses: "bg-mint/10 text-mint",
    }
};

export function ForgeNudge({ type, title, children, className }: ForgeNudgeProps) {
    // Override icon for Level 2 if needed? No, let's standarize.
    // Level 1: Desirability (Sparkles)
    // Level 2: Desirability (Users) - Maybe I should allow passing icon?
    // Let's stick to the config default for now to enforce consistency, or allow icon override.

    let styles = config[type];

    // Quick fix for Feasibility colors to be readable
    if (type === 'feasibility') {
        // Lime is bright yellow-green.
    }

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border bg-card/50 p-1 shadow-sm transition-all hover:bg-card/80",
            className
        )}>
            <div className={cn("absolute inset-y-0 left-0 w-1", styles.colorClasses.split(' ')[0].replace('text-', 'bg-'))} />

            <div className="flex gap-4 p-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", styles.iconBgClasses)}>
                    <styles.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className={cn("font-display text-base font-semibold leading-none tracking-tight",
                        type === 'feasibility' ? 'text-yellow-600 dark:text-lime' : styles.colorClasses.split(' ')[1]
                    )}>
                        {title}
                    </h4>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
