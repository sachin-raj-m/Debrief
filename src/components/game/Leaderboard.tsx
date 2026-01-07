import { useState } from 'react'
import { SimTeam, SimDecision } from "@/types/simulation"
import { CHANNELS } from '@/lib/simulation-game/constants'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Trophy, TrendingUp, DollarSign, ChevronRight, PieChart } from "lucide-react"

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
                                ? (team.total_downloads / (team.total_spent / 100000)).toFixed(1)
                                : "0.0"

                            return (
                                <div
                                    key={team.id}
                                    onClick={() => handleTeamClick(team)}
                                    className={`flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 transition-colors ${isFacilitator ? 'cursor-pointer hover:bg-white/10' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                index === 1 ? 'bg-slate-400/20 text-slate-400' :
                                                    index === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-muted-foreground'}
                      `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                                {team.name}
                                                {isFacilitator && <ChevronRight className="w-3 h-3 text-muted-foreground opacity-50" />}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {Math.floor(team.total_downloads).toLocaleString()} installs
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-green-400 flex items-center justify-end gap-1">
                                            {efficiency} <span className="text-xs font-normal text-muted-foreground">/ ₹1L</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            ₹{(team.total_spent / 100000).toFixed(1)}L spent
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
