/**
 * ExportPanel Component
 * 
 * Controls for exporting analytics data with date filtering.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ExportType = "all" | "users" | "ideas" | "games";
type ExportFormat = "json" | "csv";

export function ExportPanel() {
    const [isExporting, setIsExporting] = useState(false);
    const [selectedType, setSelectedType] = useState<ExportType>("all");
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const url = `/api/admin/analytics/export?type=${selectedType}&format=${selectedFormat}`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Export failed");
            }

            if (selectedFormat === "csv") {
                // Download CSV file
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `debrief-export-${selectedType}-${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } else {
                // Download JSON file
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `debrief-export-${selectedType}-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            }

            toast.success("Export completed", { description: `Exported ${selectedType} data as ${selectedFormat.toUpperCase()}` });
        } catch (error) {
            toast.error("Export failed", {
                description: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsExporting(false);
        }
    };

    const exportTypes: { value: ExportType; label: string }[] = [
        { value: "all", label: "All Data" },
        { value: "users", label: "Users" },
        { value: "ideas", label: "Ideas" },
        { value: "games", label: "Games" },
    ];

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="h-5 w-5" />
                    Export Data
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Export Type Selection */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Data Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {exportTypes.map((type) => (
                            <Button
                                key={type.value}
                                variant={selectedType === type.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedType(type.value)}
                            >
                                {type.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Format Selection */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Format
                    </label>
                    <div className="flex gap-2">
                        <Button
                            variant={selectedFormat === "json" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedFormat("json")}
                            className="flex items-center gap-2"
                        >
                            <FileJson className="h-4 w-4" />
                            JSON
                        </Button>
                        <Button
                            variant={selectedFormat === "csv" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedFormat("csv")}
                            className="flex items-center gap-2"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                        </Button>
                    </div>
                </div>

                {/* Export Button */}
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download Export
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
