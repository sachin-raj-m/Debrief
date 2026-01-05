/**
 * Login Page
 * 
 * Premium SaaS Login Screen
 * Dark, Cinematic, Glassmorphism
 */

"use client";

import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function LoginContent() {
    const { isAuthenticated, loading, signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/";

    useEffect(() => {
        if (isAuthenticated && !loading) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, loading, router, redirectTo]);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle(redirectTo);
        } catch (error) {
            console.error("Sign in error:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-lg shadow-primary/20" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col lg:flex-row font-sans overflow-hidden bg-background text-foreground selection:bg-primary/20">
            {/* Global Ambient Background */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-page-gradient" />

            {/* Left Side: Visual Showcase */}
            <div className="hidden lg:flex relative flex-1 flex-col items-center justify-center p-6 lg:p-12 z-10 w-full overflow-hidden">

                {/* Visual Content Container */}
                <div className="relative z-20 w-full max-w-2xl mx-auto flex flex-col items-center">

                    {/* Floating Glass Dashboard Mockup */}
                    <div className="relative mb-12 animate-fade-in-up">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-20" />

                        {/* Status Card (Glass) */}
                        <Card variant="glass" className="relative z-20 mb-8 border-white/10 mx-auto max-w-xs md:max-w-sm text-center py-6 backdrop-blur-xl bg-white/5">
                            <CardContent className="p-0 space-y-1">
                                <h3 className="font-sans text-sm font-medium text-muted-foreground">Active Polls</h3>
                                <div className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                                    12
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interactive Elements / Avatars */}
                        <div className="relative h-64 w-full md:w-96 mx-auto perspective-[1000px]">
                            {/* Central element */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                                <Card variant="glass" className="w-64 p-4 rounded-2xl border-white/10 bg-[#09090b]/40 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden transform transition-all hover:scale-105 duration-500">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Feedback</span>
                                    </div>
                                    <p className="font-heading text-lg font-bold leading-tight mb-2">
                                        "Would you use this analytics tool?"
                                    </p>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center text-[10px] z-${i}0`}>
                                                    <img src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-full h-full rounded-full opacity-80" alt="" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">+42 voted</span>
                                    </div>
                                </Card>
                            </div>

                            {/* Orbiting Elements */}
                            <div className="absolute top-0 right-10 animate-float-slow delay-100">
                                <Card variant="glass" className="px-3 py-1.5 rounded-full bg-zinc-900/50 border-white/5 backdrop-blur-md">
                                    <span className="text-xs font-semibold text-emerald-400">Yes! 🚀</span>
                                </Card>
                            </div>
                            <div className="absolute bottom-10 left-0 animate-float-slow delay-700">
                                <Card variant="glass" className="px-3 py-1.5 rounded-full bg-zinc-900/50 border-white/5 backdrop-blur-md">
                                    <span className="text-xs font-semibold text-rose-400">Maybe not</span>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="relative z-30 w-full lg:w-[600px] shrink-0 flex flex-col justify-center items-center bg-background/80 lg:bg-zinc-900/30 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 min-h-screen p-8 lg:p-16 shadow-2xl shadow-black/50">
                <div className="w-full max-w-sm space-y-8 animate-fade-in">

                    {/* Header */}
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                            <Image src="/debrief-logo.svg" alt="Debrief Logo" width={32} height={32} className="h-8 w-8" />
                            <span className="font-heading font-bold text-xl tracking-tight">debrief</span>
                        </div>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
                            Validate ideas <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">before you build.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Stop guessing. Get instant, honest feedback from real users in seconds.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Action */}
                    <div className="space-y-4">
                        <Button
                            size="lg"
                            className="w-full text-base font-semibold h-12 shadow-xl shadow-white/5 hover:shadow-white/10 transition-all duration-300"
                            onClick={handleSignIn}
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                        <p className="text-xs text-center text-muted-foreground/60">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-lg shadow-primary/20" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}
