/**
 * Admin Layout
 * 
 * Server-side admin guard - redirects non-admins to home.
 */

import { redirect } from "next/navigation";
import { getAdminStatus } from "@/lib/utils/admin";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAdmin } = await getAdminStatus();

    if (!isAdmin) {
        redirect("/");
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
}
