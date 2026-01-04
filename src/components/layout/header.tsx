/**
 * Header Component
 * 
 * Main navigation header with logo and auth button.
 */

import Link from "next/link";
import { AuthButton } from "./auth-button";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 no-underline">
                    <span className="font-display text-2xl font-bold tracking-tight text-foreground">debrief</span>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link href="/" className="font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Home
                    </Link>
                    <Link href="/ideas/new" className="font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        New Idea
                    </Link>
                </nav>
                <AuthButton />
            </div>
        </header>
    );
}
