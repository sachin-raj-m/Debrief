"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import { Users, UserCheck, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserData {
    totalUsers: number;
    activeStats: {
        active_7d: number;
        active_30d: number;
    };
    dailyGrowth: Array<{
        date: string;
        count: number;
    }>;
}

export function UserAnalytics() {
    const [data, setData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics/users')
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-white/5" />
                ))}
                <div className="col-span-full h-[400px] rounded-2xl bg-white/5" />
            </div>
        );
    }

    if (!data) return <div className="text-red-400">Error loading data</div>;

    // Data comes sorted DESC (newest first), reverse for chart (oldest left)
    const chartData = [...data.dailyGrowth].reverse().map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups: item.count
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Total Users"
                    value={data.totalUsers || 0}
                    icon={Users}
                    description="All registered accounts"
                    className="border-blue-500/20 hover:border-blue-500/40"
                />
                <StatsCard
                    title="Active (7 Days)"
                    value={data.activeStats?.active_7d || 0}
                    icon={Activity}
                    description="Users active in last week"
                    className="border-emerald-500/20 hover:border-emerald-500/40"
                />
                <StatsCard
                    title="Active (30 Days)"
                    value={data.activeStats?.active_30d || 0}
                    icon={UserCheck}
                    description="Users active in last month"
                    className="border-violet-500/20 hover:border-violet-500/40"
                />
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">User Acquisition Trend</h3>
                        <p className="text-sm text-muted-foreground">Daily user signups over the last 30 days</p>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ stroke: '#ffffff20' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="signups"
                                name="New Signups"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSignups)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
