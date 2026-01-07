"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import { Lightbulb, MessageSquare, ThumbsUp, ThumbsDown, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface IdeaData {
    summary: {
        total_ideas: number;
        avg_upvotes: number;
        avg_downvotes: number;
        avg_comments: number;
    };
    levelsDistribution: Array<{
        level_number: number;
        status: string;
        count: number;
    }>;
    topIdeas: Array<{
        id: string;
        title: string;
        upvotes_count: number;
        downvotes_count: number;
        current_level: number;
    }>;
}

export function IdeaAnalytics() {
    const [data, setData] = useState<IdeaData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics/ideas')
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

    // Process distribution for chart
    // Group by level
    const levelDataMap = new Map();
    data.levelsDistribution.forEach(item => {
        if (!levelDataMap.has(item.level_number)) {
            levelDataMap.set(item.level_number, { name: `Level ${item.level_number}`, count: 0 });
        }
        levelDataMap.get(item.level_number).count += item.count;
    });
    const chartData = Array.from(levelDataMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Ideas"
                    value={data.summary.total_ideas || 0}
                    icon={Lightbulb}
                    className="border-amber-500/20 hover:border-amber-500/40"
                />
                <StatsCard
                    title="Avg Upvotes"
                    value={Math.round(data.summary.avg_upvotes || 0)}
                    icon={ThumbsUp}
                    className="border-emerald-500/20 hover:border-emerald-500/40"
                    description="Per idea"
                />
                <StatsCard
                    title="Avg Downvotes"
                    value={Math.round(data.summary.avg_downvotes || 0)}
                    icon={ThumbsDown}
                    className="border-rose-500/20 hover:border-rose-500/40"
                    description="Per idea"
                />
                <StatsCard
                    title="Avg Engagement"
                    value={Math.round(data.summary.avg_comments || 0)}
                    icon={MessageSquare}
                    className="border-blue-500/20 hover:border-blue-500/40"
                    description="Comments per idea"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribution Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                    <h3 className="text-lg font-semibold text-white mb-6">Idea Workflow Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#ffffff10' }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="count" name="Ideas" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#fbbf24', '#fcd34d', '#34d399', '#10b981'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Ideas List */}
                <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">Top Rated Ideas</h3>
                    </div>

                    <div className="flex-1 overflow-auto -mx-2 px-2 space-y-3">
                        {data.topIdeas.map((idea, i) => (
                            <div key={idea.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                <div className="min-w-0 flex-1 mr-4">
                                    <h4 className="text-sm font-medium text-white truncate">{idea.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp className="h-3 w-3" /> {idea.upvotes_count}
                                        </span>
                                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                                            Lvl {idea.current_level}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-white/10 font-mono">
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                        {data.topIdeas.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">No ideas yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
