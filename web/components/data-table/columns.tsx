"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { ProcessComparison } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

function BoolCell({ value }: { value: number }) {
    return value === 1 ? (
        <Badge variant="default" className="gap-1">
            <Check className="size-3" />
            存在
        </Badge>
    ) : (
        <Badge variant="destructive" className="gap-1">
            <X className="size-3" />
            不存在
        </Badge>
    )
}

export const columns: ColumnDef<ProcessComparison>[] = [
    {
        accessorKey: "zid",
        header: ({ column }) => (
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                ID
                <ArrowUpDown className="ml-1 size-3.5" />
            </Button>
        ),
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.zid}</span>,
    },
    {
        accessorKey: "project",
        header: "项目",
        filterFn: "equals",
    },
    {
        accessorKey: "projectAbbr",
        header: "项目简称",
        filterFn: "equals",
    },
    {
        accessorKey: "vehicleNo",
        header: "车号",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.vehicleNo}</span>,
    },
    {
        accessorKey: "sectionNo",
        header: "节车号",
    },
    {
        accessorKey: "process",
        header: "工序",
    },
    {
        accessorKey: "easOrder",
        header: "EAS 生产订单",
        cell: ({ row }) => <BoolCell value={row.original.easOrder} />,
        filterFn: "equals",
    },
    {
        accessorKey: "easWorkHours",
        header: "EAS 工时",
        cell: ({ row }) => <BoolCell value={row.original.easWorkHours} />,
        filterFn: "equals",
    },
    {
        accessorKey: "mesDispatch",
        header: "MES 排程",
        cell: ({ row }) => <BoolCell value={row.original.mesDispatch} />,
        filterFn: "equals",
    },
]
