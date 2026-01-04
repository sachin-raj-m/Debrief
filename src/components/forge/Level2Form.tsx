"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateIdeaLevel } from "@/hooks/use-forge";
import { toast } from "sonner";
import type { IdeaLevel } from "@/types/database";
import { FeedbackSection } from "./FeedbackSection";

interface Level2FormProps {
    ideaId: string;
    levelData?: IdeaLevel;
    isLocked?: boolean;
    isOwner?: boolean;
    isAuthenticated?: boolean;
}

export function Level2Form({ ideaId, levelData, isLocked = false, isOwner = false, isAuthenticated = false }: Level2FormProps) {
    const { mutate: updateLevel, isPending } = useUpdateIdeaLevel(ideaId);
    const initialData = levelData?.data || {};

    const [formData, setFormData] = useState({
        alternatives: initialData.alternatives || "",
        why_they_fail: initialData.why_they_fail || "",
        evidence_log: initialData.evidence_log || ""
    });

    useEffect(() => {
        if (levelData?.data) {
            setFormData({
                alternatives: levelData.data.alternatives || "",
                why_they_fail: levelData.data.why_they_fail || "",
                evidence_log: levelData.data.evidence_log || ""
            });
        }
    }, [levelData]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked || !isOwner) return;

        updateLevel({
            levelNumber: 2,
            data: formData
        });
    };

    if (isLocked) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Complete Level 1: Problem Clarity to unlock this level.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-foreground">Market Reality</h3>
                    <p className="text-muted-foreground">Analysis of competitors and market evidence.</p>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Alternatives</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.alternatives || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Why They Fail</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.why_they_fail || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Evidence Log</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.evidence_log || "Not specified"}
                        </div>
                    </div>
                </div>
                <FeedbackSection
                    ideaId={ideaId}
                    levelNumber={2}
                    isOwner={isOwner}
                    isAuthenticated={isAuthenticated}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-2 border-b border-border pb-4">
                <h3 className="font-display text-2xl font-bold text-foreground">Market Reality</h3>
                <p className="text-muted-foreground text-lg">
                    What exists? Why isn't it good enough?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label htmlFor="alternatives" className="text-base font-semibold text-foreground">
                        Existing Alternatives <span className="text-muted-foreground font-normal text-sm ml-2">(Competitors)</span>
                    </label>
                    <Textarea
                        id="alternatives"
                        name="alternatives"
                        placeholder="List direct and indirect competitors..."
                        value={formData.alternatives}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="why_they_fail" className="text-base font-semibold text-foreground">
                        Why They Fail <span className="text-muted-foreground font-normal text-sm ml-2">(Gap in Market)</span>
                    </label>
                    <Textarea
                        id="why_they_fail"
                        name="why_they_fail"
                        placeholder="They are too expensive, complex, or miss X..."
                        value={formData.why_they_fail}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="evidence_log" className="text-base font-semibold text-foreground">
                        Evidence Log <span className="text-muted-foreground font-normal text-sm ml-2">(Links, notes from research)</span>
                    </label>
                    <Textarea
                        id="evidence_log"
                        name="evidence_log"
                        placeholder="Found 3 Reddit threads complaining about X..."
                        value={formData.evidence_log}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        variant="mint"
                        size="lg"
                        disabled={isPending}
                        className="px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                        {isPending ? "Saving..." : "Save & Continue"}
                    </Button>
                </div>
            </form>

            <FeedbackSection
                ideaId={ideaId}
                levelNumber={2}
                isOwner={isOwner}
                isAuthenticated={isAuthenticated}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}
