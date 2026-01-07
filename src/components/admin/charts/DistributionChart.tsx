/**
 * DistributionChart Component
 * 
 * Bar and Pie charts for displaying distributions using Recharts.
 */

"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

interface BarChartProps {
    data: Array<{ name: string; value: number }>;
    title: string;
    height?: number;
}

export function DistributionBarChart({
    data,
    title,
    height = 300,
}: BarChartProps) {
    return (
        <div className="w-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                        }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

interface PieChartProps {
    data: Array<{ name: string; value: number }>;
    title: string;
    height?: number;
}

export function DistributionPieChart({
    data,
    title,
    height = 300,
}: PieChartProps) {
    return (
        <div className="w-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                            `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                        }}
                    />
                    <Legend
                        wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
