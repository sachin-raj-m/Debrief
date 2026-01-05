
import { cn } from "@/lib/utils";
import { Check, Lightbulb, Target, Search, FlaskConical, DollarSign, Award } from "lucide-react";

export type LevelStatus = "locked" | "in_progress" | "completed";

interface JourneyStepperProps {
    currentLevel: number;
    selectedLevel: number;
    onSelectLevel: (level: number) => void;
    className?: string;
}

export function JourneyStepper({ currentLevel, selectedLevel, onSelectLevel, className }: JourneyStepperProps) {
    const steps = [
        { level: 0, title: "The Spark", description: "Idea", icon: Lightbulb },
        { level: 1, title: "Clarity", description: "Problem", icon: Target },
        { level: 2, title: "Reality", description: "Market", icon: Search },
        { level: 3, title: "Hypothesis", description: "Test", icon: FlaskConical },
        { level: 4, title: "Sustainability", description: "Model", icon: DollarSign },
        { level: 5, title: "Reflection", description: "PoW", icon: Award },
    ];

    return (
        <div className={cn("w-full rounded-3xl border border-white/5 bg-black/20 p-6 backdrop-blur-sm", className)}>
            <div className="relative flex items-start overflow-x-auto pb-4 md:pb-0 md:overflow-visible gap-8 md:gap-0 md:justify-between no-scrollbar">
                {/* Background Line */}
                <div className="hidden md:block absolute left-0 top-5 h-0.5 w-full -translate-y-1/2 bg-white/5" />

                {steps.map((step, index) => {
                    const isCompleted = index < currentLevel;
                    const isCurrent = index === currentLevel;
                    const isLocked = index > currentLevel && !(index === 1 && currentLevel === 0);
                    const isSelected = step.level === selectedLevel;

                    return (
                        <div key={step.level} className="relative flex flex-col items-center min-w-[80px] md:min-w-0 md:flex-1">
                            {/* Active Line Progress (overlaid on background line) */}
                            {index < steps.length - 1 && (index < currentLevel) && (
                                <div className="hidden md:block absolute left-[50%] top-5 h-0.5 w-full -translate-y-1/2 bg-primary/50" />
                            )}

                            <button
                                onClick={() => !isLocked && onSelectLevel(step.level)}
                                disabled={isLocked}
                                className={cn(
                                    "group relative z-10 flex flex-col items-center gap-3 transition-all duration-300 outline-none",
                                    isLocked ? "cursor-not-allowed opacity-40 grayscale" : "cursor-pointer hover:opacity-100",
                                    isSelected ? "scale-105" : "scale-100"
                                )}
                            >
                                {/* Circle Indicator */}
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500",
                                        isCompleted
                                            ? "border-primary/50 bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(var(--primary),0.5)]"
                                            : isCurrent
                                                ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10 shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)]"
                                                : "border-white/10 bg-[#09090b] text-muted-foreground hover:border-white/20",
                                        isSelected && !isCompleted && !isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : ""
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <step.icon className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Text Labels */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <span
                                        className={cn(
                                            "text-xs font-semibold tracking-wide transition-colors duration-200",
                                            isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground",
                                            isSelected ? "text-primary" : ""
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] uppercase tracking-wider",
                                        isCurrent ? "text-primary/70" : "text-muted-foreground/50"
                                    )}>
                                        {step.description}
                                    </span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
