'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, PlayCircle, Trophy, BarChart3 } from 'lucide-react'

export default function GameLobby() {
    const router = useRouter()
    const [gameIdInput, setGameIdInput] = useState('')

    const handleJoinGame = () => {
        if (!gameIdInput.trim()) return
        router.push(`/game/${gameIdInput}`)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />

            <div className="z-10 w-full max-w-4xl text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground tracking-tight">
                        Growth Strategy Lab
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-sans">
                        Compete in real-time. Optimize budget. Maximize ROI.
                        <br />
                        Can you dominate the market in 15 minutes?
                    </p>
                </div>

                <div className="flex justify-center w-full mt-12">
                    <Card variant="glass" className="w-full max-w-md group flex flex-col">
                        <CardHeader>
                            <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-foreground" />
                            </div>
                            <CardTitle className="text-foreground font-heading">Join Simulation</CardTitle>
                            <CardDescription className="text-muted-foreground font-sans">
                                Enter the game code shared by your facilitator.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Game ID..."
                                    className="bg-white/5 border-white/10 text-foreground focus:ring-white/20 font-sans"
                                    value={gameIdInput}
                                    onChange={(e) => setGameIdInput(e.target.value)}
                                />
                                <Button onClick={handleJoinGame} variant="default" className="font-sans">
                                    Join
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-slate-500 border-t border-white/10 pt-8 mt-12">
                    <div className="flex flex-col items-center gap-2">
                        <PlayCircle className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-sans">15 Minutes</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Trophy className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-sans">ROI Driven</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-sans">5 Teams Max</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
