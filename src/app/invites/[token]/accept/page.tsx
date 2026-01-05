/**
 * Invite Acceptance Page
 * 
 * Route: /invites/[token]/accept
 */

import { InviteAcceptance } from "@/components/collaboration";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;

  return <InviteAcceptance token={token} />;
}

export const metadata = {
  title: "Accept Invitation | debrief",
  description: "Accept your collaboration invitation",
};
