import { useState } from 'react'
import { SimTeam, SimDecision } from "@/types/simulation"
import { CHANNELS } from '@/lib/simulation-game/constants'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Trophy, TrendingUp, DollarSign, ChevronRight, PieChart, Gem, Medal } from "lucide-react"

interface LeaderboardProps {
    teams: SimTeam[]
    gameId?: string
    isFacilitator?: boolean
}

export default function Leaderboard({ teams, gameId, isFacilitator = false }: LeaderboardProps) {
    const supabase = createClient()
    const [selectedTeam, setSelectedTeam] = useState<SimTeam | null>(null)
    const [teamHistory, setTeamHistory] = useState<SimDecision[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Sort by efficiency (Downloads / Spent)
    const sortedTeams = [...teams].sort((a, b) => {
        const effA = a.total_spent > 0 ? (a.total_downloads / (a.total_spent / 100000)) : 0
        const effB = b.total_spent > 0 ? (b.total_downloads / (b.total_spent / 100000)) : 0
        return effB - effA
    })

    const handleTeamClick = async (team: SimTeam) => {
        if (!isFacilitator || !gameId) return

        setSelectedTeam(team)
        setIsLoadingHistory(true)
        try {
            const { data } = await supabase
                .from('sim_decisions')
                .select('*')
                .eq('game_id', gameId)
                .eq('team_id', team.id)
                .order('round_number', { ascending: true })

            if (data) setTeamHistory(data as SimDecision[])
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    // Calculate Cumulative Spend per Channel for Selected Team
    const cumulativeSpend = CHANNELS.reduce((acc, channel) => {
        acc[channel.id] = teamHistory.reduce((sum, decision) => {
            return sum + (decision.decisions[channel.id] || 0)
        }, 0)
        return acc
    }, {} as Record<string, number>)

    return (
        <>
            <Card variant="glass">
                <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedTeams.map((team, index) => {
                            const efficiency = team.total_spent > 0
                                ? Math.floor(team.total_downloads / (team.total_spent / 100000)).toString()
                                : "0"

                            // Styles based on rank
                            const isWinner = index === 0
                            const isSecond = index === 1
                            const isThird = index === 2

                            let bgClass = 'bg-white/5 border-white/5 hover:bg-white/10'
                            let textClass = 'text-base'
                            let rankIcon = null

                            if (isWinner) {
                                bgClass = 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02] z-10 my-2'
                                textClass = 'text-xl font-bold'
                                rankIcon = <Gem className="w-8 h-8 text-cyan-400 fill-cyan-400/20 animate-pulse" />
                            } else if (isSecond) {
                                bgClass = 'bg-yellow-500/10 border-yellow-500/30 my-1'
                                textClass = 'text-lg'
                                rankIcon = <Trophy className="w-6 h-6 text-yellow-400" />
                            } else if (isThird) {
                                bgClass = 'bg-orange-500/10 border-orange-500/20'
                                textClass = 'text-base'
                                rankIcon = <Medal className="w-6 h-6 text-orange-400" />
                            }

                            return (
                                <div
                                    key={team.id}
                                    onClick={() => handleTeamClick(team)}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all border ${bgClass} ${isFacilitator ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center font-bold shrink-0 ${isWinner ? 'w-10 h-10' : 'w-8 h-8'}`}>
                                            {rankIcon ? rankIcon : (
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                                                    {index + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-medium flex items-center gap-2 text-foreground ${textClass}`}>
                                                {team.name}
                                                {isFacilitator && <ChevronRight className="w-3 h-3 text-muted-foreground opacity-50" />}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {Math.floor(team.total_downloads).toLocaleString()} installs
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline-block">Efficiency:</span>
                                            <div className={`font-bold flex items-center gap-1 ${isWinner ? 'text-cyan-400 text-lg' : 'text-green-400 text-sm'}`}>
                                                {efficiency} <span className="text-xs font-normal text-muted-foreground">downloads per 1 lakh</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline-block">Total Spent:</span>
                                            <div className="text-xs text-muted-foreground">
                                                ₹{(team.total_spent / 100000).toFixed(1)}L
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {sortedTeams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center">No teams yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Drill-down Dialog */}
            <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
                <DialogContent variant="glass" className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-400" />
                            Spending Breakdown: {selectedTeam?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed analysis of where money was spent.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingHistory ? (
                        <div className="py-8 text-center text-muted-foreground animate-pulse">Loading history...</div>
                    ) : (
                        <div className="space-y-8 mt-4">
                            {/* 1. Cumulative Spend by Channel */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Total Spend by Channel</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {CHANNELS.map(channel => {
                                        const total = cumulativeSpend[channel.id] || 0
                                        if (total === 0) return null
                                        return (
                                            <div key={channel.id} className="bg-white/5 p-3 rounded border border-white/5">
                                                <div className="text-xs text-muted-foreground truncate" title={channel.name}>{channel.name}</div>
                                                <div className="text-lg font-mono text-foreground">₹{(total / 100000).toFixed(2)}L</div>
                                            </div>
                                        )
                                    })}
                                    {Object.values(cumulativeSpend).every(v => v === 0) && (
                                        <div className="text-sm text-muted-foreground col-span-full">No spending recorded yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Round-by-Round Breakdown */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Round History</h4>
                                <div className="space-y-4">
                                    {teamHistory.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No rounds submitted.</p>
                                    ) : (
                                        teamHistory.map((decision) => (
                                            <div key={decision.id} className="bg-black/20 rounded-lg p-3 border border-white/5">
                                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                                    <span className="font-bold text-blue-400">Round {decision.round_number + 1}</span>
                                                    <span className="text-xs font-mono text-muted-foreground">
                                                        Total: ₹{(Object.values(decision.decisions).reduce((a, b) => a + b, 0) / 100000).toFixed(2)}L
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    {Object.entries(decision.decisions).map(([channelId, amount]) => {
                                                        if (amount === 0) return null
                                                        const channel = CHANNELS.find(c => c.id === channelId)
                                                        return (
                                                            <div key={channelId} className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground truncate max-w-[120px]">{channel?.name || channelId}</span>
                                                                <span className="font-mono">₹{(amount / 1000).toFixed(0)}k</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
