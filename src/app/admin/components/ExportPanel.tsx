"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
// import { Button } from "@/components/ui/button"; // Assuming Button exists or use basic button
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportPanel() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: "users" | "ideas" | "games") => {
        try {
            setIsExporting(true);
            toast.info(`Generating ${type} export...`);

            const response = await fetch("/api/admin/analytics/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type }),
            });

            if (!response.ok) throw new Error("Export failed");

            const { data } = await response.json();

            // Trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `debrief-${type}-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Export completed successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate export");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 px-5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span>Export Data</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-xl border-white/10 text-white">
                <DropdownMenuLabel>Choose Dataset</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => handleExport("users")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                    <FileJson className="mr-2 h-4 w-4 text-blue-400" />
                    <span>Export Users Validated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("ideas")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                    <FileJson className="mr-2 h-4 w-4 text-purple-400" />
                    <span>Export Idea Data</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("games")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                    <FileJson className="mr-2 h-4 w-4 text-amber-400" />
                    <span>Export Game Sessions</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
