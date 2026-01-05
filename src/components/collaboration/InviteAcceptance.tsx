/**
 * Invite Acceptance Page
 * 
 * Page for accepting collaboration invitations via email link
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAcceptInvite } from "@/hooks/use-collaborators";

interface InviteAcceptanceProps {
  token: string;
}

export function InviteAcceptance({ token }: InviteAcceptanceProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { mutate: acceptInvite, isPending, isSuccess, isError, error, data } = useAcceptInvite();

  useEffect(() => {
    // Only attempt to accept if user is logged in and we haven't tried yet
    if (user && !isPending && !isSuccess && !isError) {
      acceptInvite(token);
    }
  }, [user, isPending, isSuccess, isError, acceptInvite, token]);

  // Redirect to idea page after successful acceptance
  useEffect(() => {
    if (isSuccess && data?.data.idea) {
      const ideaId = data.data.idea.id;
      setTimeout(() => {
        router.push(`/ideas/${ideaId}`);
      }, 2000);
    }
  }, [isSuccess, data, router]);

  // Loading state
  if (authLoading || (user && isPending)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Invitation
            </CardTitle>
            <CardDescription>
              {authLoading ? "Checking your login status..." : "Accepting your invitation..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to accept this collaboration invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              After signing in, you&apos;ll be able to accept the invitation and join the team.
            </p>
            <Button
              onClick={() => router.push(`/login?redirectTo=/invites/${token}/accept`)}
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess && data?.data) {
    const { idea, collaborator } = data.data;
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Invitation Accepted!
            </CardTitle>
            <CardDescription>
              You&apos;ve successfully joined the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 space-y-2">
              <p className="font-medium">{idea.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Role: <span className="font-medium capitalize">{collaborator.role}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting you to the idea...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage =
      (error as any)?.error?.message ||
      (error as any)?.message ||
      "Failed to accept invitation";

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Invitation Error
            </CardTitle>
            <CardDescription>
              We couldn&apos;t process your invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This could mean:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>The invitation link has expired</li>
                <li>The invitation was sent to a different email address</li>
                <li>The invitation has already been used</li>
                <li>The idea no longer exists</li>
              </ul>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
