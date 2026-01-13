"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import { Gamepad2, Timer, CheckCircle, TrendingUp, Download, Trophy, ExternalLink, Calendar, Users, Hash, Layers } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimGame, SimTeam } from "@/types/simulation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Leaderboard from "@/components/game/Leaderboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EnrichedTeam extends SimTeam {
    members_details: Array<{
        id: string;
        full_name: string;
        email: string;
        avatar_url: string | null;
    }>;
}

interface EnrichedGame extends SimGame {
    sim_teams: EnrichedTeam[];
}

interface GroupedSummary {
    game_type: string;
    total_games: number;
    status_waiting: number;
    status_active: number;
    status_completed: number;
    total_downloads_all_time: number;
}

interface GameData {
    summary: {
        total_games: number;
        status_waiting: number;
        status_active: number;
        status_completed: number;
        total_downloads_all_time: number;
    };
    groupedSummary: GroupedSummary[];
    efficiency: number;
    channelStats: Array<{
        channel_name: string;
        usage_count: number;
    }>;
    games: EnrichedGame[];
}

const COLORS = ['#8b5cf6', '#d946ef', '#f97316', '#0ea5e9', '#10b981', '#f59e0b'];

export function GameAnalytics() {
    const [data, setData] = useState<GameData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics/games')
            .then(res => res.json())
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getWinner = (teams: SimTeam[]) => {
        if (!teams || teams.length === 0) return null
        return [...teams].sort((a, b) => {
            const effA = a.total_spent > 0 ? (a.total_downloads / (a.total_spent / 100000)) : 0
            const effB = b.total_spent > 0 ? (b.total_downloads / (b.total_spent / 100000)) : 0
            return effB - effA
        })[0]
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
                </div>
                <div className="h-[400px] rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (!data) return <div className="text-red-400">Error loading data</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Summary Cards */}
            {/* 1. Statistics Tabs */}
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="all" className="data-[state=active]:bg-white/10">All Games</TabsTrigger>
                        {data.groupedSummary.map(g => (
                            <TabsTrigger key={g.game_type} value={g.game_type} className="capitalize data-[state=active]:bg-white/10">
                                {g.game_type}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="all" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="Total Games"
                            value={data.summary.total_games || 0}
                            icon={Gamepad2}
                            className="border-purple-500/20 hover:border-purple-500/40"
                            description={`${data.summary.status_active} Active`}
                        />
                        <StatsCard
                            title="Downloads Generated"
                            value={(data.summary.total_downloads_all_time || 0).toLocaleString()}
                            icon={Download}
                            className="border-blue-500/20 hover:border-blue-500/40"
                            description="Across all sessions"
                        />
                        <StatsCard
                            title="Avg Efficiency"
                            value={Number(data.efficiency || 0).toFixed(0)}
                            icon={TrendingUp}
                            className="border-emerald-500/20 hover:border-emerald-500/40"
                            description="Downloads per 1L"
                        />
                        <StatsCard
                            title="Completion Rate"
                            value={`${data.summary.total_games ? Math.round((data.summary.status_completed / data.summary.total_games) * 100) : 0}%`}
                            icon={CheckCircle}
                            className="border-amber-500/20 hover:border-amber-500/40"
                            description="Games fully finished"
                        />
                    </div>
                </TabsContent>

                {data.groupedSummary.map(g => (
                    <TabsContent key={g.game_type} value={g.game_type} className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                title={`${g.game_type} Games`}
                                value={g.total_games || 0}
                                icon={Layers}
                                className="border-purple-500/20 hover:border-purple-500/40"
                                description={`${g.status_active} Active`}
                            />
                            <StatsCard
                                title="Downloads"
                                value={(g.total_downloads_all_time || 0).toLocaleString()}
                                icon={Download}
                                className="border-blue-500/20 hover:border-blue-500/40"
                                description="Module specific"
                            />
                            <StatsCard
                                title="Completion %"
                                value={`${g.total_games ? Math.round((g.status_completed / g.total_games) * 100) : 0}%`}
                                icon={CheckCircle}
                                className="border-amber-500/20 hover:border-amber-500/40"
                                description="Finish rate"
                            />
                            {/* Placeholder for specific stat */}
                            <StatsCard
                                title="Waiting"
                                value={g.status_waiting}
                                icon={Timer}
                                className="border-white/10 hover:border-white/20"
                                description="In lobby"
                            />
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* 2. Charts & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Channel Strategy Preference</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.channelStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="usage_count"
                                    nameKey="channel_name"
                                    stroke="none"
                                >
                                    {data.channelStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col justify-center items-center text-center space-y-6">
                    <div className="p-4 rounded-full bg-white/5">
                        <Timer className="h-10 w-10 text-white/50" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">Status Overview</h3>
                        <p className="text-sm text-muted-foreground mt-1">Current state of all simulations</p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 w-full mt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-white">{data.summary.status_waiting}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Waiting</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-emerald-400">{data.summary.status_active}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Live</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-blue-400">{data.summary.status_completed}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Done</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Game History Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        Recent Game Sessions
                    </h2>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-muted-foreground uppercase text-xs font-medium">
                                <tr>
                                    <th className="px-4 py-3">Code / Date</th>
                                    <th className="px-4 py-3">Winner</th>
                                    <th className="px-4 py-3">Participants</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.games?.map((game) => {
                                    const winner = getWinner(game.sim_teams);
                                    const playerList = game.sim_teams.flatMap(t => t.members_details);

                                    return (
                                        <tr key={game.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="w-fit font-mono">{game.code}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(game.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {winner ? (
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                                        <div>
                                                            <div className="font-medium text-white">{winner.name}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {Math.floor(winner.total_downloads / (Math.max(1, winner.total_spent) / 100000))} Eff.
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-xs">No Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                                                    {playerList.length > 0 ? playerList.map((player) => (
                                                        <div key={player.id} className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={player.avatar_url || ''} />
                                                                <AvatarFallback className="text-[10px]">{player.full_name?.[0] || 'U'}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-white leading-none">{player.full_name || 'Unknown'}</span>
                                                                <span className="text-[10px] text-muted-foreground leading-none">{player.email}</span>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <span className="text-muted-foreground text-xs">No players</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="h-8 gap-1">
                                                            View <ExternalLink className="w-3 h-3" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                                        <Leaderboard teams={game.sim_teams} gameId={game.id} isFacilitator={true} />
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!data.games || data.games.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                            No games recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
