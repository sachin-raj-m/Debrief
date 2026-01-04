"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateIdeaLevel } from "@/hooks/use-forge";
import { toast } from "sonner";
import type { IdeaLevel } from "@/types/database";
import { FeedbackSection } from "./FeedbackSection";

interface Level1FormProps {
    ideaId: string;
    levelData?: IdeaLevel;
    isLocked?: boolean;
    isOwner?: boolean;
    isAuthenticated?: boolean;
}

export function Level1Form({ ideaId, levelData, isLocked = false, isOwner = false, isAuthenticated = false }: Level1FormProps) {
    const { mutate: updateLevel, isPending } = useUpdateIdeaLevel(ideaId);

    // Initial data from levelData.data (JSONB)
    const initialData = levelData?.data || {};

    const [formData, setFormData] = useState({
        target_persona: initialData.target_persona || "",
        current_workarounds: initialData.current_workarounds || "",
        pain_points: initialData.pain_points || ""
    });

    // Update local state if levelData loads later
    useEffect(() => {
        if (levelData?.data) {
            setFormData({
                target_persona: levelData.data.target_persona || "",
                current_workarounds: levelData.data.current_workarounds || "",
                pain_points: levelData.data.pain_points || ""
            });
        }
    }, [levelData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) return;

        updateLevel({
            levelNumber: 1,
            data: formData
        }, {
            onSuccess: () => {
                // Optional: Trigger any parent updates or level completion logic here
            }
        });
    };

    if (isLocked) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Complete the previous level to unlock this step.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-foreground">Problem Clarity</h3>
                    <p className="text-muted-foreground">
                        How the author defines the problem.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">
                            Target Persona (Who has the problem?)
                        </label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                            {formData.target_persona || "Not specified"}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">
                            Current Workarounds (How do they solve it now?)
                        </label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.current_workarounds || "Not specified"}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">
                            Pain Points (Why do the workarounds fail?)
                        </label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.pain_points || "Not specified"}
                        </div>
                    </div>

                    <div className="rounded-lg bg-blue-500/10 p-4 text-sm text-blue-600">
                        Only the idea author can edit this section.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-2 border-b border-border pb-4">
                <h3 className="font-display text-2xl font-bold text-foreground">Problem Clarity</h3>
                <p className="text-muted-foreground text-lg">
                    Prove the problem is real. Who has it? What are they doing now?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label htmlFor="target_persona" className="text-base font-semibold text-foreground">
                        Target Persona <span className="text-muted-foreground font-normal text-sm ml-2">(Who has the problem?)</span>
                    </label>
                    <Input
                        id="target_persona"
                        name="target_persona"
                        placeholder="e.g. College students applying for internships"
                        value={formData.target_persona}
                        onChange={handleChange}
                        disabled={isPending}
                        className="h-12 text-base px-4 bg-background/50 border-input/60 focus:bg-background transition-colors"
                    />
                </div>

                <div className="space-y-3">
                    <label htmlFor="current_workarounds" className="text-base font-semibold text-foreground">
                        Current Workarounds <span className="text-muted-foreground font-normal text-sm ml-2">(How do they solve it now?)</span>
                    </label>
                    <Textarea
                        id="current_workarounds"
                        name="current_workarounds"
                        placeholder="e.g. They use Excel sheets or WhatsApp groups"
                        value={formData.current_workarounds}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <label htmlFor="pain_points" className="text-base font-semibold text-foreground">
                        Pain Points <span className="text-muted-foreground font-normal text-sm ml-2">(Why do the workarounds fail?)</span>
                    </label>
                    <Textarea
                        id="pain_points"
                        name="pain_points"
                        placeholder="e.g. Excel is static, WhatsApp is messy and unsearchable"
                        value={formData.pain_points}
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
                levelNumber={1}
                isOwner={isOwner}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}
