"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"

interface DataTableProps<TData> {
    table: TanstackTable<TData>
    totalRows: number
}

export function DataTable<TData>({ table, totalRows }: DataTableProps<TData>) {
    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-10 px-3 text-sm">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-3 py-2.5 text-sm">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                    没有匹配的数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>共 {totalRows} 条记录</span>
                    <span>·</span>
                    <span>
                        第 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{" "}
                        {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalRows)} 条
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">每页</span>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[75px] text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50, 100].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center">
                        <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="第一页">
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="上一页">
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="flex items-center gap-1 px-2 text-sm tabular-nums">
                            <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{table.getPageCount()}</span>
                        </span>
                        <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="下一页">
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                            aria-label="最后一页"
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
