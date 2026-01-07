/**
 * StatsCard Component
 * 
 * Displays a metric with optional trend indicator.
 * Follows the glassmorphism design pattern.
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        label?: string;
    };
    icon?: LucideIcon;
    className?: string;
}

export function StatsCard({
    title,
    value,
    subtitle,
    trend,
    icon: Icon,
    className,
}: StatsCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
        if (trend.value < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const getTrendColor = () => {
        if (!trend) return "";
        if (trend.value > 0) return "text-green-400";
        if (trend.value < 0) return "text-red-400";
        return "text-muted-foreground";
    };

    return (
        <Card variant="glass" className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                        {subtitle && (
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={cn("mt-2 flex items-center gap-1 text-sm", getTrendColor())}>
                                {getTrendIcon()}
                                <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
                                {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className="rounded-lg bg-white/5 p-3">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
