/**
 * TimeSeriesChart Component
 * 
 * Line chart for displaying data over time using Recharts.
 */

"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface TimeSeriesChartProps {
    data: Array<{ date: string; count: number }>;
    title: string;
    color?: string;
    height?: number;
}

export function TimeSeriesChart({
    data,
    title,
    color = "#8b5cf6",
    height = 300,
}: TimeSeriesChartProps) {
    // Format date for display
    const formattedData = data.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
    }));

    return (
        <div className="w-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="displayDate"
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
                        labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
