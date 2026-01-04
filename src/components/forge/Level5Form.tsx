"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUpdateIdeaLevel, useIdeaFeedback } from "@/hooks/use-forge";
import type { IdeaLevel } from "@/types/database";
import { FeedbackSummary } from "./FeedbackSummary";

interface Level5FormProps {
    ideaId: string;
    levelData?: IdeaLevel;
    isLocked?: boolean;
    isOwner?: boolean;
}

export function Level5Form({ ideaId, levelData, isLocked = false, isOwner = false }: Level5FormProps) {
    const { mutate: updateLevel, isPending } = useUpdateIdeaLevel(ideaId);
    const { data: feedback } = useIdeaFeedback(ideaId);
    const initialData = levelData?.data || {};

    const [formData, setFormData] = useState({
        key_learnings: initialData.key_learnings || "",
        feedback_impact: initialData.feedback_impact || "",
        decision: initialData.decision || "", // Go, No-Go, Pivot
        pow_url: initialData.pow_url || ""
    });

    useEffect(() => {
        if (levelData?.data) {
            setFormData({
                key_learnings: levelData.data.key_learnings || "",
                feedback_impact: levelData.data.feedback_impact || "",
                decision: levelData.data.decision || "",
                pow_url: levelData.data.pow_url || ""
            });
        }
    }, [levelData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked || !isOwner) return;

        updateLevel({ levelNumber: 5, data: formData });
    };

    if (isLocked) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Complete Level 4: Sustainability to unlock this level.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-foreground">Reflection</h3>
                    <p className="text-muted-foreground">Outcome of the validation journey.</p>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Decision</label>
                        <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                            {formData.decision || "Pending"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Key Learnings</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.key_learnings || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Proof of Work</label>
                        {formData.pow_url ? (
                            <a href={formData.pow_url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline break-all">
                                {formData.pow_url}
                            </a>
                        ) : (
                            <div className="text-sm text-muted-foreground">Not provided</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-2 border-b border-border pb-4">
                <h3 className="font-display text-2xl font-bold text-foreground">Reflection</h3>
                <p className="text-muted-foreground text-lg">
                    What happened? What's next?
                </p>
            </div>

            <FeedbackSummary ideaId={ideaId} />

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label htmlFor="decision" className="text-base font-semibold text-foreground">
                        Decision
                    </label>
                    <div className="relative">
                        <select
                            id="decision"
                            name="decision"
                            value={formData.decision}
                            onChange={handleChange}
                            disabled={isPending}
                            className="flex h-12 w-full items-center justify-between rounded-md border border-input/60 bg-background/50 px-4 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-colors"
                        >
                            <option value="">Select a decision...</option>
                            <option value="GO">🚀 GO (Build it)</option>
                            <option value="NO-GO">🛑 NO-GO (Drop it)</option>
                            <option value="PIVOT">🔄 PIVOT (Change direction)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label htmlFor="key_learnings" className="text-base font-semibold text-foreground">
                        Key Learnings <span className="text-muted-foreground font-normal text-sm ml-2">(What did you learn?)</span>
                    </label>
                    <Textarea
                        id="key_learnings"
                        name="key_learnings"
                        placeholder="Unexpected findings, customer insights..."
                        value={formData.key_learnings}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <label htmlFor="feedback_impact" className="text-base font-semibold text-foreground">
                        Feedback Impact <span className="text-muted-foreground font-normal text-sm ml-2">(How did peer feedback influence this?)</span>
                    </label>
                    <Textarea
                        id="feedback_impact"
                        name="feedback_impact"
                        placeholder="Changes made based on feedback, valid critiques..."
                        value={formData.feedback_impact}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[100px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <label htmlFor="pow_url" className="text-base font-semibold text-foreground">
                        Proof of Work URL <span className="text-muted-foreground font-normal text-sm ml-2">(Public link to evidence/result)</span>
                    </label>
                    <Input
                        id="pow_url"
                        name="pow_url"
                        placeholder="e.g. Notion doc, Twitter thread, GitHub repo..."
                        value={formData.pow_url}
                        onChange={handleChange}
                        disabled={isPending}
                        className="h-12 text-base px-4 bg-background/50 border-input/60 focus:bg-background transition-colors"
                    />
                </div>

                <div className="flex justify-end pt-4">
                    {feedback?.data && feedback.data.length === 0 ? (
                        <div className="text-right space-y-2">
                            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm max-w-md ml-auto">
                                <p className="font-semibold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    Feedback Required
                                </p>
                                <p className="mt-1">
                                    You cannot complete the journey without peer feedback. Share your idea to get at least 1 review.
                                </p>
                            </div>
                            <Button disabled variant="ghost" className="opacity-50 cursor-not-allowed">
                                Complete Journey
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="submit"
                            variant="mint"
                            size="lg"
                            disabled={isPending}
                            className="px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                        >
                            {isPending ? "Finish Journey" : "Complete Journey"}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
