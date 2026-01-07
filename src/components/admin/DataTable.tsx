/**
 * DataTable Component
 * 
 * Generic sortable table for displaying data with export capability.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Column<T> {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    title: string;
    data: T[];
    columns: Column<T>[];
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
    title,
    data,
    columns,
    emptyMessage = "No data available",
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortKey) return 0;
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (typeof aVal === "number" && typeof bVal === "number") {
            return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    const getSortIcon = (key: keyof T) => {
        if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
        return sortOrder === "asc"
            ? <ArrowUp className="h-4 w-4" />
            : <ArrowDown className="h-4 w-4" />;
    };

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {columns.map((col) => (
                                        <th
                                            key={String(col.key)}
                                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                                        >
                                            {col.sortable !== false ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSort(col.key)}
                                                    className="flex items-center gap-1 -ml-2 hover:text-foreground"
                                                >
                                                    {col.header}
                                                    {getSortIcon(col.key)}
                                                </Button>
                                            ) : (
                                                col.header
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={String(col.key)}
                                                className="px-4 py-3 text-sm text-foreground"
                                            >
                                                {col.render
                                                    ? col.render(row[col.key], row)
                                                    : String(row[col.key] ?? "-")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
