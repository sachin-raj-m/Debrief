'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SimGame, SimTeam } from '@/types/simulation'
import { CHANNELS, TOTAL_BUDGET_POOL, MAX_ROUNDS } from '@/lib/simulation-game/constants'
import { submitDecision, processRound, startGame } from '@/app/actions/game-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, TrendingDown, Info, AlertTriangle, Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Leaderboard from './Leaderboard'
import { useRouter } from 'next/navigation'

interface DashboardProps {
    game: SimGame
    team?: SimTeam | null
    currentUser: string
}

export default function Dashboard({ game: initialGame, team: initialTeam, currentUser }: DashboardProps) {
    const router = useRouter()
    const supabase = createClient()

    const [game, setGame] = useState<SimGame>(initialGame)
    const [teams, setTeams] = useState<SimTeam[]>(initialTeam ? [initialTeam] : []) // Start with own team
    const [inputs, setInputs] = useState<Record<string, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const [submittedTeamIds, setSubmittedTeamIds] = useState<string[]>([])

    // Fetch submissions for current round (for Facilitator view)
    useEffect(() => {
        const fetchSubmissions = async () => {
            const { data } = await supabase
                .from('sim_decisions')
                .select('team_id')
                .eq('game_id', game.id)
                .eq('round_number', game.current_round)

            if (data) {
                setSubmittedTeamIds(data.map(d => d.team_id))
            } else {
                setSubmittedTeamIds([])
            }
        }
        fetchSubmissions()
    }, [game.id, game.current_round, supabase])

    const isPlayer = !!initialTeam

    // Fetch all teams initially
    useEffect(() => {
        const fetchTeams = async () => {
            const { data } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
            if (data) setTeams(data as SimTeam[])
        }
        fetchTeams()
    }, [game.id, supabase])

    // Real-time Subscriptions - Only depend on game.id to prevent subscription recreation
    useEffect(() => {
        const gameSub = supabase
            .channel('game_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sim_games', filter: `id=eq.${game.id}` },
                (payload) => {
                    const newGame = payload.new as SimGame

                    // Use functional update to compare with previous state
                    setGame(prevGame => {
                        // Reset submission state on new round
                        if (newGame.current_round !== prevGame.current_round) {
                            setHasSubmitted(false)
                            setInputs({})
                            setSubmittedTeamIds([]) // Clear submitted teams for new round
                            toast.info(`Round ${newGame.current_round + 1} Started!`)
                        }

                        if (newGame.status === 'active' && prevGame.status === 'waiting') {
                            toast.success("Game Started!")
                        }

                        return newGame
                    })
                }
            )
            .subscribe()

        const teamSub = supabase
            .channel('team_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sim_teams', filter: `game_id=eq.${game.id}` },
                async () => {
                    // Refresh all teams
                    const { data } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
                    if (data) setTeams(data as SimTeam[])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(gameSub)
            supabase.removeChannel(teamSub)
        }
    }, [game.id, supabase]) // Only game.id dependency

    // Real-time Decisions Subscription (For Facilitator)
    useEffect(() => {
        const decisionSub = supabase
            .channel('decision_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sim_decisions', filter: `game_id=eq.${game.id}` },
                (payload) => {
                    const newDecision = payload.new as { team_id: string, round_number: number }
                    if (newDecision.round_number === game.current_round) {
                        setSubmittedTeamIds(prev => {
                            if (!prev.includes(newDecision.team_id)) return [...prev, newDecision.team_id]
                            return prev
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(decisionSub)
        }
    }, [game.id, game.current_round, supabase])

    // --- Handlers ---

    const handleInputChange = (channelId: string, value: number) => {
        setInputs(prev => ({
            ...prev,
            [channelId]: value
        }))
    }

    const getTotalPlannedSpend = () => {
        return Object.values(inputs).reduce((a, b) => a + b, 0)
    }

    const handleSubmit = async () => {
        if (!initialTeam) return
        try {
            setIsSubmitting(true)
            await submitDecision(game.id, initialTeam.id, game.current_round, inputs)
            setHasSubmitted(true)
            toast.success("Decisions submitted! Waiting for other teams...")
        } catch (error) {
            toast.error("Failed to submit", { description: error instanceof Error ? error.message : "Unknown error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleProcessRound = async () => {
        try {
            setIsSubmitting(true)
            await processRound(game.id)
            toast.success("Round processed!")
        } catch (error) {
            toast.error("Error processing round", { description: error instanceof Error ? error.message : "Error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStartGame = async () => {
        try {
            setIsSubmitting(true)
            await startGame(game.id)
            toast.success("Game started!")
        } catch (error) {
            toast.error("Failed to start", { description: error instanceof Error ? error.message : "Error" })
        } finally {
            setIsSubmitting(false)
        }
    }

    // --- Derived State ---
    const budgetLeftGlobal = game.budget_pool
    const budgetPercent = (budgetLeftGlobal / TOTAL_BUDGET_POOL) * 100
    const isCreator = game.created_by === currentUser

    if (game.status === 'completed') {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center relative bg-background">
                <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />
                <h1 className="text-4xl font-heading font-bold text-foreground mb-8">
                    Game Over!
                </h1>
                <div className="w-full max-w-2xl">
                    <Leaderboard teams={teams} />
                </div>
                <Button onClick={() => router.push('/game')} className="mt-8" variant="default">Back to Lobby</Button>
            </div>
        )
    }

    if (game.status === 'waiting') {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center space-y-8 relative bg-background">
                <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Waiting for Players...</h1>
                    <p className="text-muted-foreground font-sans text-lg">
                        Share Game ID: <span className="font-mono text-foreground bg-white/10 px-2 py-1 rounded">{game.code}</span>
                    </p>
                </div>

                <Card variant="glass" className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-foreground font-heading">
                            <span>Joined Teams</span>
                            <Badge variant="outline" className="text-muted-foreground">{teams.length} / 5</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {teams.map(t => (
                            <div key={t.id} className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/5">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground font-sans">{t.name}</span>
                                {t.id === initialTeam?.id && <Badge className="ml-auto bg-white/10 hover:bg-white/20 text-white">You</Badge>}
                            </div>
                        ))}
                        {teams.length === 0 && <div className="text-center text-muted-foreground py-4">No teams yet.</div>}
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center gap-4">
                    {teams.length >= 5 ? (
                        <div className="flex items-center gap-2 text-green-400 font-sans">
                            <Loader2 className="w-4 h-4 animate-spin" /> Starting game automatically...
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground font-sans">
                            Game starts automatically when 5 teams join.
                        </p>
                    )}

                    {isCreator && (
                        <Button
                            onClick={handleStartGame}
                            disabled={isSubmitting}
                            variant="default"
                            className="px-8 py-6 text-lg"
                        >
                            {isSubmitting ? 'Starting...' : 'Start Game Now'}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 font-sans text-foreground pb-24 relative">
            <div className="fixed inset-0 z-[-1] bg-page-gradient pointer-events-none" />

            {/* --- Top Bar --- */}
            <div className="max-w-7xl mx-auto mb-6 grid gap-4 md:grid-cols-3">
                {/* Round Info */}
                <Card variant="glass">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Round</div>
                            <div className="text-3xl font-mono text-foreground">{game.current_round + 1} <span className="text-muted-foreground text-lg">/ {MAX_ROUNDS}</span></div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Clock className="text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                {/* Global Budget Pool */}
                <Card variant="glass" className="md:col-span-2">
                    <CardContent className="p-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Market Budget Pool</span>
                            <span className="text-sm font-mono text-green-400">₹{(budgetLeftGlobal / 100000).toFixed(2)} Lakhs Remaining</span>
                        </div>
                        <Progress value={budgetPercent} className="h-4 bg-white/5" indicatorClassName={budgetPercent < 20 ? 'bg-red-500' : 'bg-green-500'} />
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            If this hits ₹0, the game ends immediately for everyone.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">

                {/* --- Main Game Area (Channels) --- */}
                <div className="lg:col-span-2 space-y-6">
                    {isPlayer ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {CHANNELS.map(channel => {
                                const currentSpend = inputs[channel.id] || 0
                                const isMaxed = currentSpend > channel.max_spend_per_round

                                return (
                                    <Card key={channel.id} variant="glass" className={`transition-colors ${hasSubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-foreground">{channel.name}</div>
                                                <Badge variant="outline" className="text-xs bg-black/20 text-muted-foreground border-white/10">
                                                    Max: ₹{channel.max_spend_per_round / 100000}L
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-xs text-muted-foreground h-8 line-clamp-2">
                                                {channel.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Cost/1k: ₹{channel.cost_per_1k}</span>
                                                <span className={`${currentSpend > 0 ? 'text-green-400' : 'text-muted-foreground'} font-mono`}>
                                                    ₹{(currentSpend).toLocaleString()}
                                                </span>
                                            </div>
                                            <Slider
                                                value={[currentSpend]}
                                                max={channel.max_spend_per_round}
                                                step={100000}
                                                onValueChange={(val: number[]) => handleInputChange(channel.id, val[0])}
                                                className="py-2"
                                            />
                                            {channel.efficiency_trend === 'decreasing' && (
                                                <div className="flex items-center gap-1 text-[10px] text-red-400">
                                                    <TrendingDown className="w-3 h-3" /> Efficiency drops over time
                                                </div>
                                            )}
                                            {channel.efficiency_trend === 'increasing' && (
                                                <div className="flex items-center gap-1 text-[10px] text-green-400">
                                                    <TrendingUp className="w-3 h-3" /> Efficiency improves over time
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <Card className="p-8 border-dashed border-slate-800 bg-transparent flex flex-col items-center justify-center text-center space-y-4">
                            <Info className="w-12 h-12 text-slate-600" />
                            <h3 className="text-xl font-heading text-slate-400">Facilitator View</h3>
                            <p className="text-slate-500 max-w-md">
                                You are observing this game. The teams are currently playing round {game.current_round + 1}.
                            </p>
                        </Card>
                    )}
                </div>

                {/* --- Sidebar (Your Stats & Leaderboard) --- */}
                <div className="space-y-6">
                    {/* Your Team Status */}
                    {/* Your Team Status */}
                    {isPlayer && initialTeam && (
                        <Card className="bg-blue-950/20 border-blue-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-blue-400 text-lg">Your Agency: {initialTeam.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Planned Spend</div>
                                        <div className="text-xl font-mono text-foreground">₹{(getTotalPlannedSpend() / 100000).toFixed(1)}L</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Total Downloads</div>
                                        <div className="text-xl font-mono text-foreground">{Math.floor(initialTeam.total_downloads).toLocaleString()}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Leaderboard teams={teams} />

                    {/* Admin Controls */}
                    {isCreator && (
                        <Card className="bg-red-950/10 border-red-500/20">
                            <CardHeader className="pb-2"><CardTitle className="text-red-400 text-sm">Facilitator Controls</CardTitle></CardHeader>
                            <CardContent>
                                <Button onClick={handleProcessRound} disabled={isSubmitting} variant="destructive" className="w-full">
                                    End Round {game.current_round + 1} & Calculate
                                </Button>
                                <p className="text-[10px] text-red-400 mt-2">
                                    Pressing this will process all decisions and advance to next round.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* --- Sticky Footer Action --- */}
            {isPlayer && (
                <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-md border-t border-white/10 p-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="text-muted-foreground text-sm hidden md:block">
                            Adjust sliders above to allocate your budget.
                        </div>
                        <div className="flex gap-4 items-center w-full md:w-auto">
                            <div className="text-right mr-4">
                                <div className="text-xs text-muted-foreground">Round Allocation</div>
                                <div className={`font-mono font-bold ${getTotalPlannedSpend() > budgetLeftGlobal ? 'text-red-500' : 'text-foreground'}`}>
                                    ₹{(getTotalPlannedSpend() / 100000).toFixed(2)}L
                                </div>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isSubmitting || hasSubmitted || getTotalPlannedSpend() === 0 || getTotalPlannedSpend() > budgetLeftGlobal}
                                className={`w-full md:w-auto ${hasSubmitted ? 'bg-green-600 hover:bg-green-600' : ''}`}
                                variant={hasSubmitted ? "default" : "default"} // Use default for submit, or maybe brand color
                            >
                                {hasSubmitted ? 'Submitted (Waiting)' : 'Submit Bids'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
