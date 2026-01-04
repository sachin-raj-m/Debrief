"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useUpdateIdeaLevel } from "@/hooks/use-forge";
import { toast } from "sonner";
import { ForgeNudge } from "./ForgeNudge";
import type { IdeaLevel } from "@/types/database";
import { FeedbackSection } from "./FeedbackSection";

interface Level3FormProps {
    ideaId: string;
    levelData?: IdeaLevel;
    isLocked?: boolean;
    isOwner?: boolean;
    isAuthenticated?: boolean;
}

export function Level3Form({ ideaId, levelData, isLocked = false, isOwner = false, isAuthenticated = false }: Level3FormProps) {
    const { mutate: updateLevel, isPending } = useUpdateIdeaLevel(ideaId);
    const initialData = levelData?.data || {};

    const [formData, setFormData] = useState({
        hypothesis: initialData.hypothesis || "",
        test_method: initialData.test_method || "",
        success_criteria: initialData.success_criteria || ""
    });

    useEffect(() => {
        if (levelData?.data) {
            setFormData({
                hypothesis: levelData.data.hypothesis || "",
                test_method: levelData.data.test_method || "",
                success_criteria: levelData.data.success_criteria || ""
            });
        }
    }, [levelData]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked || !isOwner) return;

        updateLevel({
            levelNumber: 3,
            data: formData
        });
    };

    if (isLocked) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Complete Level 2: Market Reality to unlock this level.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-foreground">The Hypothesis</h3>
                    <p className="text-muted-foreground">What they are testing and how.</p>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Hypothesis</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.hypothesis || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Test Method</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.test_method || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Success Criteria</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.success_criteria || "Not specified"}
                        </div>
                    </div>
                </div>
                <FeedbackSection
                    ideaId={ideaId}
                    levelNumber={3}
                    isOwner={isOwner}
                    isAuthenticated={isAuthenticated}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {!isLocked && isOwner && (
                <ForgeNudge
                    type="feasibility"
                    title="Focus on Feasibility"
                >
                    Can we build this? Define a clear hypothesis and how you will test it technically or operationally.
                </ForgeNudge>
            )}

            <div className="space-y-2 border-b border-border pb-4">
                <h3 className="font-display text-2xl font-bold text-foreground">The Hypothesis</h3>
                <p className="text-muted-foreground text-lg">
                    Design your 48-Hour Test.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label htmlFor="hypothesis" className="text-base font-semibold text-foreground">
                        Hypothesis Statement
                    </label>
                    <Textarea
                        id="hypothesis"
                        name="hypothesis"
                        placeholder="If we [do X] for [Persona Y], they will [Action Z]..."
                        value={formData.hypothesis}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="test_method" className="text-base font-semibold text-foreground">
                        Test Method <span className="text-muted-foreground font-normal text-sm ml-2">(How will you verify this?)</span>
                    </label>
                    <Textarea
                        id="test_method"
                        name="test_method"
                        placeholder="e.g. Landing Page, Cold DM campaign, Fake Door test..."
                        value={formData.test_method}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="success_criteria" className="text-base font-semibold text-foreground">
                        Success Criteria <span className="text-muted-foreground font-normal text-sm ml-2">(What defines success?)</span>
                    </label>
                    <Input
                        id="success_criteria"
                        name="success_criteria"
                        placeholder="e.g. 10 signups, 5 calls booked, 15% conversion rate"
                        value={formData.success_criteria}
                        onChange={handleChange}
                        className="h-12 text-base px-4 bg-background/50 border-input/60 focus:bg-background transition-colors"
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
                levelNumber={3}
                isOwner={isOwner}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}
