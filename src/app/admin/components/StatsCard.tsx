import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    description?: string;
    className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, description, className }: StatsCardProps) {
    return (
        <div className={cn(
            "relative p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-black/50 group overflow-hidden",
            className
        )}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className="p-2 rounded-lg bg-white/5 text-white/80 group-hover:bg-white/10 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
                <div className="flex items-center gap-2">
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1",
                            trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                        </span>
                    )}
                    {(trend || description) && (
                        <span className="text-xs text-muted-foreground truncate">
                            {trend ? trend.label : description}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
