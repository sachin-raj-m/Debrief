"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateIdeaLevel } from "@/hooks/use-forge";
import type { IdeaLevel } from "@/types/database";
import { FeedbackSection } from "./FeedbackSection";

interface Level4FormProps {
    ideaId: string;
    levelData?: IdeaLevel;
    isLocked?: boolean;
    isOwner?: boolean;
    isAuthenticated?: boolean;
}

export function Level4Form({ ideaId, levelData, isLocked = false, isOwner = false, isAuthenticated = false }: Level4FormProps) {
    const { mutate: updateLevel, isPending } = useUpdateIdeaLevel(ideaId);
    const initialData = levelData?.data || {};

    const [formData, setFormData] = useState({
        revenue_model: initialData.revenue_model || "",
        distribution_channels: initialData.distribution_channels || "",
        cost_structure: initialData.cost_structure || ""
    });

    useEffect(() => {
        if (levelData?.data) {
            setFormData({
                revenue_model: levelData.data.revenue_model || "",
                distribution_channels: levelData.data.distribution_channels || "",
                cost_structure: levelData.data.cost_structure || ""
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

        updateLevel({ levelNumber: 4, data: formData });
    };

    if (isLocked) {
        return (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <p>Complete Level 3: Hypothesis to unlock this level.</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-display text-xl font-semibold text-foreground">Sustainability</h3>
                    <p className="text-muted-foreground">Viability and Business Model.</p>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Revenue Model</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.revenue_model || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Distribution</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.distribution_channels || "Not specified"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-muted-foreground">Costs</label>
                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formData.cost_structure || "Not specified"}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-2 border-b border-border pb-4">
                <h3 className="font-display text-2xl font-bold text-foreground">Sustainability</h3>
                <p className="text-muted-foreground text-lg">
                    How will this survive and grow?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <label htmlFor="revenue_model" className="text-base font-semibold text-foreground">
                        Revenue Model <span className="text-muted-foreground font-normal text-sm ml-2">(How do you make money?)</span>
                    </label>
                    <Textarea
                        id="revenue_model"
                        name="revenue_model"
                        placeholder="e.g. Subscription, Transaction fees, Ads..."
                        value={formData.revenue_model}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="distribution_channels" className="text-base font-semibold text-foreground">
                        Distribution Channels <span className="text-muted-foreground font-normal text-sm ml-2">(How do you acquire users?)</span>
                    </label>
                    <Textarea
                        id="distribution_channels"
                        name="distribution_channels"
                        placeholder="e.g. SEO, Social Media, Partnerships..."
                        value={formData.distribution_channels}
                        onChange={handleChange}
                        disabled={isPending}
                        className="min-h-[120px] text-base p-4 bg-background/50 border-input/60 focus:bg-background transition-colors resize-none"
                    />
                </div>
                <div className="space-y-3">
                    <label htmlFor="cost_structure" className="text-base font-semibold text-foreground">
                        Cost Structure <span className="text-muted-foreground font-normal text-sm ml-2">(Major expenses)</span>
                    </label>
                    <Textarea
                        id="cost_structure"
                        name="cost_structure"
                        placeholder="e.g. Server costs, API fees, Marketing..."
                        value={formData.cost_structure}
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
                levelNumber={4}
                isOwner={isOwner}
                isAuthenticated={isAuthenticated}
            />
        </div>
    );
}
