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
                    <Button variant="default" size="lg" className="w-full sm:w-auto gap-2 font-bold bg-mint-500 hover:bg-mint-600 text-white shadow-lg shadow-mint-500/20">
                        <Coins className="h-5 w-5" />
                        Back this Idea
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Back this Idea</DialogTitle>
                    <DialogDescription>
                        Pledge your support to show the founder there is real market demand. This is a non-binding pledge.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label>Select Pledge Amount</Label>
                        <div className="flex gap-2">
                            {presetAmounts.map((amount) => (
                                <Button
                                    key={amount}
                                    variant={parseInt(pledgeAmount) === amount ? "default" : "outline"}
                                    onClick={() => setPledgeAmount(amount.toString())}
                                    className="flex-1"
                                >
                                    ₹{amount}
                                </Button>
                            ))}
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                            <Input
                                type="number"
                                placeholder="Custom Amount"
                                value={pledgeAmount}
                                onChange={(e) => setPledgeAmount(e.target.value)}
                                className="pl-6"
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
                            className="resize-none"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                        <Label htmlFor="anonymous">Back Anonymously</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleBack} disabled={isPending || !pledgeAmount} className="w-full">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Pledge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
