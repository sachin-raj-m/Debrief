"use client";

import { useAuth } from "@/hooks";
import { ADMIN_EMAILS } from "@/lib/simulation-game/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
                router.replace("/");
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />
                    <div className="text-muted-foreground animate-pulse">Verifying admin access...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-20 pb-10">
            {children}
        </div>
    );
}
