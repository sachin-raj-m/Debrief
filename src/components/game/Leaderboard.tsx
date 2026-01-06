'use client'

import { SimTeam } from "@/types/simulation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, DollarSign } from "lucide-react"

export default function Leaderboard({ teams }: { teams: SimTeam[] }) {
    // Sort by efficiency (Downloads / Spent)
    // If spent is 0, efficient is 0.
    const sortedTeams = [...teams].sort((a, b) => {
        const effA = a.total_spent > 0 ? (a.total_downloads / (a.total_spent / 100000)) : 0
        const effB = b.total_spent > 0 ? (b.total_downloads / (b.total_spent / 100000)) : 0
        return effB - effA
    })

    return (
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
                            <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                            index === 1 ? 'bg-slate-400/20 text-slate-400' :
                                                index === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-muted-foreground'}
                  `}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{team.name}</div>
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
    )
}
