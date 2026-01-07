'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SimDecision, SimGame, SimTeam, SimResult } from "@/types/simulation"
import { CHANNELS, TOTAL_BUDGET_POOL, MAX_ROUNDS } from '@/lib/simulation-game/constants'
import { submitDecision, processRound, startGame } from '@/app/actions/game-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Trophy, TrendingUp, TrendingDown, DollarSign, Clock, Users, ArrowRight, AlertTriangle, Play, Info, Loader2 } from "lucide-react"
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
    const isCreator = game.created_by === currentUser
    const currentTeam = isPlayer ? (teams.find(t => t.id === initialTeam.id) || initialTeam) : null

    // Fetch all teams initially
    useEffect(() => {
        const fetchTeams = async () => {
            const { data } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
            if (data) setTeams(data as SimTeam[])
        }
        fetchTeams()
    }, [game.id, supabase])

    // Real-time Subscriptions - Re-added dependencies to ensure closures are fresh
    useEffect(() => {
        console.log("Subscribing to game_updates and team_updates for:", game.id)

        const gameSub = supabase
            .channel('game_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sim_games', filter: `id=eq.${game.id}` },
                (payload) => {
                    console.log("Received game update:", payload)
                    const newGame = payload.new as SimGame

                    setGame(prevGame => {
                        // Reset submission state on new round
                        if (newGame.current_round !== prevGame.current_round) {
                            console.log(`Round changed from ${prevGame.current_round} to ${newGame.current_round}`)
                            setHasSubmitted(false)
                            setInputs({})
                            setSubmittedTeamIds([])
                            toast.info(`Round ${newGame.current_round + 1} Started!`)

                            // Refresh teams to get updated totals after round processing
                            supabase.from('sim_teams').select('*').eq('game_id', game.id).then(({ data }) => {
                                if (data) setTeams(data as SimTeam[])
                            })
                        }

                        // Handle Game Over
                        if (newGame.status === 'completed' && prevGame.status !== 'completed') {
                            toast.info("Game Over! 🎉")
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
                async (payload) => {
                    console.log("Received team update:", payload)
                    // Refresh all teams to ensure leaderboard sync
                    const { data } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
                    if (data) setTeams(data as SimTeam[])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(gameSub)
            supabase.removeChannel(teamSub)
        }
    }, [game.id, supabase])

    // Real-time Decisions Subscription (For Facilitator)
    // CRITICAL: Must depend on game.current_round to filter correctly
    useEffect(() => {
        if (!isCreator) return; // Only subscribe if creator

        console.log("Subscribing to decision_updates for round:", game.current_round)
        const decisionSub = supabase
            .channel('decision_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sim_decisions', filter: `game_id=eq.${game.id}` },
                (payload) => {
                    console.log("Received decision update:", payload)
                    const newDecision = payload.new as { team_id: string, round_number: number }

                    // Check against the CURRENT round in the dependency closure
                    if (newDecision.round_number === game.current_round) {
                        setSubmittedTeamIds(prev => {
                            if (!prev.includes(newDecision.team_id)) {
                                console.log("New submission detected from:", newDecision.team_id)
                                return [...prev, newDecision.team_id]
                            }
                            return prev
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(decisionSub)
        }
    }, [game.id, game.current_round, isCreator, supabase])

    // --- Timer & Polling ---
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    // Polling Fallback to ensure state sync even if realtime fails
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            const { data: latestGame } = await supabase.from('sim_games').select('*').eq('id', game.id).single()
            if (latestGame && latestGame.current_round !== game.current_round) {
                // Force update if we drifted
                setGame(latestGame as SimGame)
            }
            // Also refresh teams (ALWAYS, to ensure stats update)
            const { data } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
            if (data) setTeams(data as SimTeam[])

            // If Creator, refresh submissions status
            if (isCreator) {
                const { data: bids } = await supabase.from('sim_decisions').select('team_id').eq('game_id', game.id).eq('round_number', game.current_round)
                if (bids) setSubmittedTeamIds(bids.map(b => b.team_id))
            }
        }, 5000)
        return () => clearInterval(pollInterval)
    }, [game.id, game.current_round, supabase])

    // Countdown Timer & Auto-Process
    useEffect(() => {
        if (game.status !== 'active' || !game.round_ends_at) {
            setTimeLeft(null)
            return
        }

        const checkTimer = () => {
            const end = new Date(game.round_ends_at!).getTime()
            const now = Date.now()
            const diff = end - now

            setTimeLeft(Math.max(0, diff))

            // Auto-ends round for Creator
            if (diff <= 0 && isCreator && !isSubmitting) {
                console.log("Timer expired! Auto-processing round...")
                handleProcessRound()
            }
        }

        // Check immediately
        checkTimer()

        const timer = setInterval(checkTimer, 1000)
        return () => clearInterval(timer)
    }, [game.round_ends_at, game.status, isCreator, isSubmitting])

    const formatTime = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60)
        const minutes = Math.floor((ms / 1000 / 60))
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

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
            const result = await processRound(game.id)

            // Refresh teams to get updated totals
            const { data: updatedTeams } = await supabase.from('sim_teams').select('*').eq('game_id', game.id)
            if (updatedTeams) setTeams(updatedTeams as SimTeam[])

            // Show summary of results
            if (result.results && result.results.length > 0) {
                const totalDownloads = result.results.reduce((sum, r) => sum + r.downloads_earned, 0)
                const totalSpent = result.results.reduce((sum, r) => sum + r.round_spending, 0)
                toast.success(`Round processed! ${totalDownloads.toLocaleString()} downloads, ₹${(totalSpent / 100000).toFixed(1)}L spent`)
            } else {
                toast.success("Round processed!")
            }
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

    // --- Round Report Logic ---
    const [roundReport, setRoundReport] = useState<{ myResult: SimResult | undefined, topResult: SimResult | undefined, teamMap: Record<string, string> } | null>(null)
    const [isReportOpen, setIsReportOpen] = useState(false)

    useEffect(() => {
        // When round changes to > 0, fetch results of previous round
        if (game.current_round > 0) {
            const fetchReport = async () => {
                const roundToFetch = game.current_round - 1
                console.log("Fetching report for round:", roundToFetch)

                const { data: results } = await supabase
                    .from('sim_results')
                    .select('*')
                    .eq('game_id', game.id)
                    .eq('round_number', roundToFetch)

                if (results && results.length > 0) {
                    const typedResults = results as SimResult[]
                    // Find top team
                    const top = typedResults.sort((a, b) => b.efficiency_score - a.efficiency_score)[0]
                    // Find my team result
                    const my = initialTeam ? typedResults.find(r => r.team_id === initialTeam.id) : undefined

                    // Map team IDs to names (since results only have IDs)
                    const tMap: Record<string, string> = {}
                    teams.forEach(t => tMap[t.id] = t.name)

                    setRoundReport({ myResult: my, topResult: top, teamMap: tMap })
                    setIsReportOpen(true)
                }
            }
            fetchReport()
        }
    }, [game.current_round, game.id, initialTeam, teams, supabase])

    // --- Derived State ---
    const budgetLeftGlobal = game.budget_pool
    const budgetPercent = (budgetLeftGlobal / TOTAL_BUDGET_POOL) * 100


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

    // Calculate Rank
    const sortedTeams = [...teams].sort((a, b) => {
        const effA = a.total_spent > 0 ? (a.total_downloads / (a.total_spent / 100000)) : 0
        const effB = b.total_spent > 0 ? (b.total_downloads / (b.total_spent / 100000)) : 0
        return effB - effA
    })
    const myRank = currentTeam ? sortedTeams.findIndex(t => t.id === currentTeam.id) + 1 : '-'

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
                            <div className="text-3xl font-mono text-foreground flex items-baseline gap-2">
                                {game.current_round + 1} <span className="text-muted-foreground text-lg">/ {MAX_ROUNDS}</span>
                            </div>
                        </div>
                        {timeLeft !== null && (
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Time Left</div>
                                <div className={`text-3xl font-mono ${timeLeft < 10000 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        )}
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
                                            <div className="flex items-center gap-4 py-2">
                                                <Slider
                                                    value={[currentSpend]}
                                                    max={channel.max_spend_per_round}
                                                    step={10000} // Finer control
                                                    onValueChange={(val: number[]) => handleInputChange(channel.id, val[0])}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    className="w-24 h-8 bg-black/40 border-white/10 font-mono text-xs text-right"
                                                    value={currentSpend}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0
                                                        // Clamp to max
                                                        const clamped = Math.min(val, channel.max_spend_per_round)
                                                        handleInputChange(channel.id, clamped)
                                                    }}
                                                    max={channel.max_spend_per_round}
                                                />
                                            </div>
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
                        <Card className="p-6 border-dashed border-slate-700 bg-slate-900/50">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Info className="w-6 h-6 text-blue-400" />
                                    <h3 className="text-xl font-heading text-foreground">Facilitator View - Round {game.current_round + 1}</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white/5 rounded p-3">
                                        <div className="text-muted-foreground">Teams Submitted</div>
                                        <div className="text-2xl font-mono text-green-400">{submittedTeamIds.length} / {teams.length}</div>
                                    </div>
                                    <div className="bg-white/5 rounded p-3">
                                        <div className="text-muted-foreground">Budget Remaining</div>
                                        <div className="text-2xl font-mono text-green-400">₹{(game.budget_pool / 100000).toFixed(1)}L</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground flex justify-between px-2 uppercase tracking-wider font-bold">
                                        <span>Team Status</span>
                                        <div className="flex gap-4">
                                            <span className="w-20 text-right">Spent</span>
                                            <span className="w-24 text-right">DLs</span>
                                        </div>
                                    </div>
                                    {teams.map(team => (
                                        <div key={team.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-sm border-l-2 border-transparent hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {submittedTeamIds.includes(team.id) ? (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Submitted" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Waiting" />
                                                )}
                                                <span className="text-foreground font-medium">{team.name}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-mono items-center">
                                                <span className="w-20 text-right text-muted-foreground">₹{(team.total_spent / 100000).toFixed(1)}L</span>
                                                <span className="w-24 text-right text-foreground font-bold">{Math.floor(team.total_downloads).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* --- Sidebar (Your Stats & Leaderboard) --- */}
                <div className="space-y-6">
                    {/* Your Team Status */}
                    {isPlayer && currentTeam && (
                        <Card className="bg-blue-950/20 border-blue-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Trophy className="w-16 h-16 text-blue-500" />
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-blue-400 text-lg flex items-center justify-between">
                                    <span>{currentTeam.name}</span>
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                        Rank #{myRank}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Planned Spend</div>
                                        <div className="text-xl font-mono text-foreground">₹{(getTotalPlannedSpend() / 100000).toFixed(1)}L</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Total Downloads</div>
                                        <div className="text-xl font-mono text-foreground">{Math.floor(currentTeam.total_downloads).toLocaleString()}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Leaderboard - Only for Facilitator */}
                    {isCreator && <Leaderboard teams={teams} />}

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

            {/* --- Round Report Dialog --- */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent variant="glass">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center">Round {game.current_round} Complete!</DialogTitle>
                        <DialogDescription className="text-center">Here's how the market performed.</DialogDescription>
                    </DialogHeader>

                    {roundReport && (
                        <div className="space-y-6 my-4">
                            {/* Top Performer */}
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                <div className="text-sm text-yellow-500 font-bold uppercase tracking-wider mb-1">Top Performer</div>
                                <div className="text-2xl font-heading text-foreground">
                                    {roundReport.topResult ? roundReport.teamMap[roundReport.topResult.team_id] : 'Unknown'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Efficiency: <span className="text-green-400 font-mono">{roundReport.topResult?.efficiency_score}</span> / ₹1L
                                </div>
                            </div>

                            {/* My Performance */}
                            {roundReport.myResult ? (
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground font-bold uppercase">Your Performance</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded p-3">
                                            <div className="text-xs text-muted-foreground">Downloads</div>
                                            <div className="text-xl font-mono text-foreground">{Math.floor(roundReport.myResult.downloads_earned).toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white/5 rounded p-3">
                                            <div className="text-xs text-muted-foreground">Spent</div>
                                            <div className="text-xl font-mono text-foreground">₹{(roundReport.myResult.round_spending / 100000).toFixed(1)}L</div>
                                        </div>
                                    </div>
                                    {roundReport.myResult.event_log && roundReport.myResult.event_log.length > 0 && (
                                        <div className="bg-blue-500/10 text-blue-300 text-xs p-3 rounded mt-2">
                                            <strong className="block mb-1 text-blue-400">Market Events:</strong>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {roundReport.myResult.event_log.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground italic">You did not participate in this round.</p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsReportOpen(false)} className="w-full">
                            Continue to Round {game.current_round + 1}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
