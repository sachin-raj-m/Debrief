/**
 * Header Component
 * 
 * Floating glass pill navigation header with responsive design and premium micro-interactions.
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./auth-button";
import { cn } from "@/lib/utils";

export function Header() {
    return (
        <header className="fixed top-2 md:top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto group relative flex h-14 w-full max-w-4xl items-center justify-between rounded-full border border-white/5 bg-black/40 px-3 md:px-6 shadow-lg shadow-black/10 backdrop-blur-2xl transition-all duration-500 hover:border-white/10 hover:bg-black/50 hover:shadow-black/20">

                {/* Gradient Shine Effect on Hover */}
                <div className="absolute inset-0 -z-10 rounded-full bg-linear-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2 no-underline transition-transform duration-300 hover:scale-105 active:scale-95">
                    <Image
                        src="/favicon.svg"
                        alt="Debrief Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                    />
                    <span className="font-display text-xl font-bold tracking-tight text-white/90 drop-shadow-sm">debrief</span>
                </Link>

                {/* Navigation Links (Hidden on small mobile, visible on tablet+) */}
                <nav className="hidden items-center gap-8 md:flex">
                    <Link
                        href="/"
                        className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-white"
                    >
                        Feed
                    </Link>
                    <Link
                        href="/ideas/new"
                        className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-white"
                    >
                        New Idea
                    </Link>
                </nav>

                {/* Mobile New Idea Action */}
                <Link
                    href="/ideas/new"
                    className="flex md:hidden items-center justify-center h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </Link>

                {/* Auth & Actions */}
                <div className="flex items-center gap-4">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
