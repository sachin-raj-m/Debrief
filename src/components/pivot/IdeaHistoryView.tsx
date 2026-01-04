"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { IdeaVersionWithMetadata } from "@/types/database";
import { formatDistanceToNow } from "@/lib/utils";

interface IdeaHistoryViewProps {
  version: IdeaVersionWithMetadata;
  onClose: () => void;
}

export function IdeaHistoryView({ version, onClose }: IdeaHistoryViewProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>
              {version.is_current ? "Current Version" : `Version ${version.version_number}`}
            </DialogTitle>
            {version.is_current && <Badge>Live</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(version.created_at)}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Title</h3>
            <p className="text-lg font-semibold text-foreground">{version.title}</p>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {version.description}
            </p>
          </div>

          {/* Pivot Reason */}
          {version.pivot_reason && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Reason for Pivot
                </h3>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {version.pivot_reason}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Forge Level:</span>
              <span className="ml-2 font-medium">Level {version.current_level_at_pivot}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>
              <span className="ml-2 font-medium">#{version.version_number}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
