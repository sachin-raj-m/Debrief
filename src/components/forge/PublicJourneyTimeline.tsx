"use client";

import { useIdeaLevels } from "@/hooks/use-forge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Circle, ArrowRight } from "lucide-react";
import type { IdeaLevel } from "@/types/database";

interface PublicJourneyTimelineProps {
    ideaId: string;
    currentLevel: number;
}

export function PublicJourneyTimeline({ ideaId, currentLevel }: PublicJourneyTimelineProps) {
    const { data: levels, isLoading } = useIdeaLevels(ideaId);

    if (isLoading) {
        return <div className="animate-pulse space-y-8">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-24 w-full bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>;
    }

    const getLevelData = (levelNum: number) => levels?.data?.find(l => l.level_number === levelNum);

    const steps = [
        {
            level: 1,
            title: "Problem Clarity",
            description: "Defining the core problem and target audience.",
            renderContent: (data: any) => (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Persona</span>
                        <p className="mt-1 font-medium">{data.target_persona || "Not defined"}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Pain Points</span>
                        <p className="mt-1 font-medium">{data.pain_points || "Not defined"}</p>
                    </div>
                </div>
            )
        },
        {
            level: 2,
            title: "Market Reality",
            description: "Analyzing competitors and market failures.",
            renderContent: (data: any) => (
                <div className="space-y-4">
                    <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Why Alternatives Fail</span>
                        <p className="mt-1 text-sm leading-relaxed">{data.why_they_fail || "Not analyzed"}</p>
                    </div>
                </div>
            )
        },
        {
            level: 3,
            title: "The Hypothesis",
            description: "Designing the 48-hour test.",
            renderContent: (data: any) => (
                <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-2">Hypothesis</span>
                        <p className="italic text-foreground/90">"{data.hypothesis_statement || "..."}"</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Test:</span> {data.test_method}
                    </div>
                </div>
            )
        },
        {
            level: 4,
            title: "Sustainability",
            description: "Business model and growth.",
            renderContent: (data: any) => (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-1">Revenue</span>
                        <p className="text-sm font-medium">{data.revenue_model || "TBD"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-1">Distribution</span>
                        <p className="text-sm font-medium">{data.distribution_channels || "TBD"}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-1">Costs</span>
                        <p className="text-sm font-medium">{data.cost_structure || "TBD"}</p>
                    </div>
                </div>
            )
        },
        {
            level: 5,
            title: "Reflection",
            description: "Final decision and learnings.",
            renderContent: (data: any) => (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-bold border",
                            data.decision === "GO" ? "bg-green-500/10 text-green-600 border-green-200" :
                                data.decision === "NO-GO" ? "bg-red-500/10 text-red-600 border-red-200" :
                                    "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                        )}>
                            {data.decision || "PENDING"}
                        </span>
                        {data.pow_url && (
                            <a href={data.pow_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                                Proof of Work <ArrowRight className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Key Learnings</span>
                        <p className="mt-1 text-sm leading-relaxed">{data.key_learnings || "No learnings recorded."}</p>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="relative space-y-0 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
            {steps.map((step) => {
                const levelData = getLevelData(step.level);
                const isCompleted = currentLevel >= step.level || (step.level === 5 && levelData?.data?.decision);
                const isCurrent = currentLevel === step.level - 1; // 0-indexed vs 1-indexed (Level 1 is index 0 in progression logic usually, but current_level stores COMPLETED level count? No, stores NEXT level to unlock? Let's check logic.
                // Logic check:
                // Level 1: current_level starts at 0. Completed -> 1.
                // If current_level = 1, Level 1 is done, Level 2 is unlocked.
                // So if step.level <= currentLevel, it IS done.
                // Exception: Level 5 is done if currentLevel = 5.

                const isDone = step.level <= currentLevel;
                const isLocked = step.level > currentLevel + 1;

                return (
                    <div key={step.level} className="relative pb-12 pl-12 group last:pb-0">
                        <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm transition-colors group-hover:border-primary/50">
                            {isDone ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : isLocked ? (
                                <Lock className="h-5 w-5 text-muted-foreground/40" />
                            ) : (
                                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <h3 className={cn(
                                    "text-lg font-bold font-display",
                                    isLocked ? "text-muted-foreground" : "text-foreground"
                                )}>
                                    Level {step.level}: {step.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>

                            {!isLocked && levelData?.data && (
                                <div className="rounded-xl border border-border/60 bg-card/50 p-6 shadow-sm transition-all hover:bg-card hover:shadow-md">
                                    {step.renderContent(levelData.data)}
                                </div>
                            )}

                            {isLocked && (
                                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                                    Locked
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
