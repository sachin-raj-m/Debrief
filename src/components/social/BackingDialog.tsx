"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBackIdea } from "@/hooks/use-social-validation";
import { Switch } from "@/components/ui/switch";
import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackingDialogProps {
    ideaId: string;
    trigger?: React.ReactNode;
}

export function BackingDialog({ ideaId, trigger }: BackingDialogProps) {
    const [open, setOpen] = useState(false);
    const [pledgeAmount, setPledgeAmount] = useState<string>(""); // Use string for input handling
    const [comment, setComment] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);

    const { mutate: backIdea, isPending } = useBackIdea(ideaId);

    const handleBack = () => {
        const amount = parseInt(pledgeAmount);
        if (isNaN(amount) || amount < 0) return;

        backIdea(
            { pledge_amount: amount, comment, is_anonymous: isAnonymous },
            {
                onSuccess: () => {
                    setOpen(false);
                    setPledgeAmount("");
                    setComment("");
                },
            }
        );
    };

    const presetAmounts = [10, 50, 100, 500];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="shimmer-primary" size="lg" className="flex-1 sm:flex-initial sm:w-auto gap-2 font-bold text-sm sm:text-base h-10 sm:h-11">
                        <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Back this Idea</span>
                        <span className="sm:hidden">Back</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Coins className="h-5 w-5 text-primary" />
                        Back this Idea
                    </DialogTitle>
                    <DialogDescription>
                        Pledge your support to show the founder there is real market demand. This is a non-binding pledge.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label>Select Pledge Amount</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {presetAmounts.map((amount) => {
                                const isSelected = parseInt(pledgeAmount) === amount;
                                return (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setPledgeAmount(amount.toString())}
                                        className={cn(
                                            "flex h-10 items-center justify-center rounded-md border text-sm font-medium transition-all hover:scale-105 active:scale-95",
                                            isSelected
                                                ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_-2px_rgba(255,255,255,0.1)]"
                                                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                        )}
                                    >
                                        ₹{amount}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative mt-2">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                            <Input
                                type="number"
                                placeholder="Custom Amount"
                                value={pledgeAmount}
                                onChange={(e) => setPledgeAmount(e.target.value)}
                                className="pl-6 bg-white/5 border-white/10 focus-visible:ring-primary/50"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Leave a Comment (Optional)</Label>
                        <Textarea
                            placeholder="I'd buy this if..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none bg-white/5 border-white/10 focus-visible:ring-primary/50 min-h-[100px]"
                        />
                    </div>

                    <div className="flex items-center space-x-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                        <Label htmlFor="anonymous" className="cursor-pointer">Back Anonymously</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleBack}
                        disabled={isPending || !pledgeAmount}
                        variant="shimmer-primary"
                        className="w-full font-bold"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Pledge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
