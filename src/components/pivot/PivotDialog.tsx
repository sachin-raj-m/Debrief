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
import { useCreatePivot, useVersionHistory } from "@/hooks/use-pivots";
import { Loader2, GitBranch, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PivotDialogProps {
  ideaId: string;
  currentTitle: string;
  currentDescription: string;
  trigger?: React.ReactNode;
}

export function PivotDialog({
  ideaId,
  currentTitle,
  currentDescription,
  trigger,
}: PivotDialogProps) {
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pivotReason, setPivotReason] = useState("");

  const { data: historyData } = useVersionHistory(ideaId);
  const { mutate: createPivot, isPending } = useCreatePivot(ideaId);

  const nextVersionNumber = (historyData?.data?.length || 0) + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle && !newDescription) {
      return; // Validation will be handled by the backend
    }

    createPivot(
      {
        new_title: newTitle || undefined,
        new_description: newDescription || undefined,
        pivot_reason: pivotReason,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setNewTitle("");
          setNewDescription("");
          setPivotReason("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <GitBranch className="mr-2 h-4 w-4" />
            Create Pivot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create New Pivot
          </DialogTitle>
          <DialogDescription>
            Archive the current version and evolve your idea. Your journey will be preserved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will save the current state as{" "}
                <Badge variant="outline" className="mx-1">
                  Version {nextVersionNumber - 1}
                </Badge>
                and create a new working version.
              </AlertDescription>
            </Alert>

            {/* Current State Preview */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Current Version (to be archived):
              </p>
              <p className="font-semibold text-foreground">{currentTitle}</p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {currentDescription}
              </p>
            </div>

            {/* New Title */}
            <div className="space-y-2">
              <Label htmlFor="new-title">
                New Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Leave blank to keep current title"
                maxLength={200}
              />
            </div>

            {/* New Description */}
            <div className="space-y-2">
              <Label htmlFor="new-description">
                New Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="new-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Leave blank to keep current description"
                rows={4}
                maxLength={5000}
                className="resize-none"
              />
            </div>

            {/* Pivot Reason (Required) */}
            <div className="space-y-2">
              <Label htmlFor="pivot-reason" className="text-foreground">
                Why are you pivoting? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="pivot-reason"
                value={pivotReason}
                onChange={(e) => setPivotReason(e.target.value)}
                placeholder="E.g., Customer interviews revealed nobody cares about X..."
                rows={3}
                maxLength={1000}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {pivotReason.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Pivot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
