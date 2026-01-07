"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import { Gamepad2, Timer, CheckCircle, TrendingUp, Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GameData {
    summary: {
        total_games: number;
        status_waiting: number;
        status_active: number;
        status_completed: number;
        total_downloads_all_time: number;
    };
    efficiency: number;
    channelStats: Array<{
        channel_name: string;
        usage_count: number;
    }>;
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

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-white/5" />
                ))}
                <div className="col-span-full h-[400px] rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (!data) return <div className="text-red-400">Error loading data</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
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
                    value={Number(data.efficiency || 0).toFixed(2)}
                    icon={TrendingUp}
                    className="border-emerald-500/20 hover:border-emerald-500/40"
                    description="Score points / 1L spent"
                />
                <StatsCard
                    title="Completion Rate"
                    value={`${data.summary.total_games ? Math.round((data.summary.status_completed / data.summary.total_games) * 100) : 0}%`}
                    icon={CheckCircle}
                    className="border-amber-500/20 hover:border-amber-500/40"
                    description="Games fully finished"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Channel Popularity Chart */}
                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Channel Strategy Preference</h3>
                    <div className="h-[350px] w-full">
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
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Additional Stats / Feed */}
                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col justify-center items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-white/5">
                        <Timer className="h-8 w-8 text-white/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Status Overview</h3>
                    <div className="grid grid-cols-3 gap-8 w-full max-w-sm mt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-white">{data.summary.status_waiting}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Waiting</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-emerald-400">{data.summary.status_active}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Live</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-blue-400">{data.summary.status_completed}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Done</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
