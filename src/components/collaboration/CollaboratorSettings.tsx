/**
 * Collaborator Settings Component
 * 
 * Displays and manages team members for an idea
 */

"use client";

import { useState } from "react";
import { Users, UserPlus, MoreVertical, Trash2, Mail, Clock, CheckCircle2, XCircle, Copy, Shield, Crown } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollaborators, useRemoveCollaborator } from "@/hooks/use-collaborators";
import { InviteDialog } from "./InviteDialog";
import { cn } from "@/lib/utils";
import type { IdeaCollaboratorWithDetails } from "@/types/database";

interface CollaboratorSettingsProps {
  ideaId: string;
  isOwner: boolean;
  currentUserId: string;
}

export function CollaboratorSettings({ ideaId, isOwner, currentUserId }: CollaboratorSettingsProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { data: collaboratorsResponse, isLoading, isError } = useCollaborators(ideaId);
  const { mutate: removeCollaborator } = useRemoveCollaborator(ideaId);

  const collaborators = collaboratorsResponse?.data || [];

  const handleRemove = (collaborator: IdeaCollaboratorWithDetails) => {
    const isSelf = collaborator.user_id === currentUserId;
    const confirmMessage = isSelf
      ? "Are you sure you want to leave this team?"
      : `Remove ${collaborator.email} from this team?`;

    if (!confirm(confirmMessage)) return;

    removeCollaborator(collaborator.id, {
      onSuccess: (response) => {
        toast.success("Collaborator removed successfully");
      },
      onError: (err: any) => {
        const message = err?.error?.message || err?.message || "Failed to remove collaborator";
        toast.error(message);
      },
    });
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invites/${token}/accept`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard!");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "editor": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "declined": return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Team Composition
            </h3>
            <p className="text-sm text-center text-muted-foreground w-full">
              Manage your Avengers team.
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>

        <Card variant="glass" className="p-1 bg-[#09090b]/50">
          {isLoading && (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="py-12 text-center text-rose-500 bg-rose-950/10 rounded-2xl m-2 border border-rose-500/20">
              Failed to load team members
            </div>
          )}

          {!isLoading && !isError && collaborators.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-white/5 p-4 ring-1 ring-white/10">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground">Solo Journey</p>
              <p className="max-w-xs text-sm text-muted-foreground mt-1">
                You're currently flying solo. Build your squad to accelerate progress.
              </p>
              {isOwner && (
                <Button
                  variant="outline"
                  className="mt-6 border-dashed border-white/20 hover:border-primary/50"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  Invite Collaborators
                </Button>
              )}
            </div>
          )}

          {!isLoading && !isError && collaborators.length > 0 && (
            <div className="space-y-1">
              {collaborators.map((collaborator) => {
                const isSelf = collaborator.user_id === currentUserId;
                const canRemove = isOwner || isSelf;

                return (
                  <div
                    key={collaborator.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white/5 hover:border-white/5"
                  >
                    {/* Top row with avatar, info and actions */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
                        {collaborator.user?.avatar_url && (
                          <AvatarImage
                            src={collaborator.user.avatar_url}
                            alt={collaborator.user.full_name || collaborator.email}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-white/10 text-xs font-medium text-muted-foreground">
                          {collaborator.status === "pending" ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            getInitials(collaborator.user?.full_name || collaborator.email)
                          )}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
                            {collaborator.user?.full_name || "Unknown User"}
                          </p>
                          {isSelf && <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">YOU</span>}
                          {getStatusIcon(collaborator.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-mono max-w-[180px] sm:max-w-none">
                          {collaborator.email}
                        </p>

                      </div>

                      {/* Role Badge and Actions - moved to same row on mobile */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                        <Badge variant={getRoleBadgeVariant(collaborator.role) as any} className="capitalize">
                          {collaborator.role === 'admin' && <Crown className="mr-1 h-3 w-3" />}
                          {collaborator.role === 'editor' && <Shield className="mr-1 h-3 w-3" />}
                          {collaborator.role}
                        </Badge>

                        {/* Actions - always visible */}
                        {canRemove && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#09090b]/90 backdrop-blur-xl border-white/10">
                              <DropdownMenuItem
                                onClick={() => handleRemove(collaborator)}
                                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isSelf ? "Leave Team" : "Remove Member"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    {/* Pending status - full width below on mobile */}
                    {collaborator.status === "pending" && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/20 w-full sm:w-fit sm:ml-14">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-xs font-medium text-amber-500">
                            Pending
                            <span className="opacity-50 mx-1">•</span>
                            Expires {new Date(collaborator.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                        {isOwner && collaborator.invite_token && (
                          <button
                            onClick={() => handleCopyInviteLink(collaborator.invite_token!)}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 hover:underline"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Link
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>

      {isOwner && (
        <InviteDialog
          ideaId={ideaId}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}
    </>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
