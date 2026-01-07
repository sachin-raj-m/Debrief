/**
 * Header Component
 * 
 * Floating glass pill navigation header with responsive design and premium micro-interactions.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "./auth-button";
import { cn } from "@/lib/utils";
import { Menu, X, Home, PlusCircle, Sparkles, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks";
import { ADMIN_EMAILS } from "@/lib/simulation-game/constants";

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    // Check if current user is an admin
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

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

                {/* Navigation Links (Hidden on mobile, visible on tablet+) */}
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
                    <Link
                        href="/game"
                        className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white group/lab"
                    >
                        <svg className="h-4 w-4 text-purple-400 transition-transform group-hover/lab:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover/lab:from-purple-300 group-hover/lab:to-blue-300">
                            Growth Lab
                        </span>
                    </Link>
                    {isAdmin && (
                        <Link
                            href="/admin/analytics"
                            className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-white group/admin"
                        >
                            <BarChart3 className="h-4 w-4 text-amber-400 transition-transform group-hover/admin:scale-110" />
                            <span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent group-hover/admin:from-amber-300 group-hover/admin:to-orange-300">
                                Analytics
                            </span>
                        </Link>
                    )}
                </nav>

                {/* Auth & Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex md:hidden items-center justify-center h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                    <AuthButton />
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div
                    className="pointer-events-auto absolute top-16 left-4 right-4 md:hidden rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <nav className="flex flex-col p-2">
                        <Link
                            href="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Home className="h-5 w-5" />
                            Feed
                        </Link>
                        <Link
                            href="/ideas/new"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <PlusCircle className="h-5 w-5" />
                            New Idea
                        </Link>
                        <Link
                            href="/game"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Growth Lab
                            </span>
                        </Link>
                        {isAdmin && (
                            <Link
                                href="/admin/analytics"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <BarChart3 className="h-5 w-5 text-amber-400" />
                                <span className="bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    Analytics
                                </span>
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
