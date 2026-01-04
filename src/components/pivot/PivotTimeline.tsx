"use client";

import { formatDistanceToNow } from "@/lib/utils";
import { useVersionHistory } from "@/hooks/use-pivots";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GitBranch, Circle, CheckCircle2 } from "lucide-react";
import type { IdeaVersionWithMetadata } from "@/types/database";
import { useState } from "react";
import { IdeaHistoryView } from "./IdeaHistoryView";

interface PivotTimelineProps {
  ideaId: string;
}

export function PivotTimeline({ ideaId }: PivotTimelineProps) {
  const { data, isLoading, isError } = useVersionHistory(ideaId);
  const [selectedVersion, setSelectedVersion] = useState<IdeaVersionWithMetadata | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data?.data || data.data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
        <GitBranch className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No version history yet</p>
      </div>
    );
  }

  const versions = data.data;

  return (
    <>
      <div className="relative space-y-6">
        {/* Timeline connector line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        {versions.map((version, index) => {
          const isLast = index === versions.length - 1;
          const isCurrent = version.is_current;

          return (
            <Card
              key={version.id}
              className={`relative pl-12 pr-4 py-4 transition-all hover:shadow-md cursor-pointer ${
                isCurrent ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedVersion(version)}
            >
              {/* Timeline dot */}
              <div className="absolute left-[7px] top-4 z-10">
                {isCurrent ? (
                  <Circle className="h-6 w-6 fill-primary text-primary" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isCurrent ? "default" : "outline"}>
                    {isCurrent ? "Current" : `Version ${version.version_number}`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(version.created_at)}
                  </span>
                </div>

                <h4 className="font-semibold text-foreground">{version.title}</h4>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {version.description}
                </p>

                {version.pivot_reason && !isCurrent && (
                  <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Pivot Reason:
                    </p>
                    <p className="text-sm text-foreground">{version.pivot_reason}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Level {version.current_level_at_pivot}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* History View Modal */}
      {selectedVersion && (
        <IdeaHistoryView
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}
    </>
  );
}
