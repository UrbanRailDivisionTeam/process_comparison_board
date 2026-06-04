"use client"
"use no memo"

import { useMemo, useState } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import * as XLSX from "xlsx"

import { columns } from "@/components/data-table/columns"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { HeaderBar } from "@/components/header-bar"
import { mockData } from "@/lib/mock-data"
import type { ProcessComparison } from "@/lib/types"

export default function Page() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [columnVisibility] = useState<VisibilityState>({})

    const [projectFilter, setProjectFilter] = useState("all")
    const [vehicleNoFilter, setVehicleNoFilter] = useState("")
    const [sectionNoFilter, setSectionNoFilter] = useState("all")
    const [processFilter, setProcessFilter] = useState("all")

    const uniqueProjects = useMemo(() => [...new Set(mockData.map((d) => d.project))].sort(), [])
    const uniqueSectionNos = useMemo(() => [...new Set(mockData.map((d) => d.sectionNo))].sort(), [])
    const uniqueProcesses = useMemo(() => [...new Set(mockData.map((d) => d.process))].sort(), [])

    const filteredData = useMemo(() => {
        return mockData.filter((row) => {
            if (projectFilter !== "all" && row.project !== projectFilter) return false
            if (sectionNoFilter !== "all" && row.sectionNo !== sectionNoFilter) return false
            if (processFilter !== "all" && row.process !== processFilter) return false

            if (vehicleNoFilter) {
                if (!row.vehicleNo.toLowerCase().includes(vehicleNoFilter.toLowerCase())) return false
            }

            if (globalFilter) {
                const search = globalFilter.toLowerCase()
                return (
                    row.process.toLowerCase().includes(search) ||
                    row.vehicleNo.toLowerCase().includes(search) ||
                    row.sectionNo.toLowerCase().includes(search) ||
                    row.project.toLowerCase().includes(search)
                )
            }

            return true
        })
    }, [globalFilter, projectFilter, vehicleNoFilter, sectionNoFilter, processFilter])

    const table = useReactTable<ProcessComparison>({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: 30,
            },
        },
    })

    const hasActiveFilters = projectFilter !== "all" || vehicleNoFilter !== "" || sectionNoFilter !== "all" || processFilter !== "all" || globalFilter !== ""

    function clearFilters() {
        setProjectFilter("all")
        setVehicleNoFilter("")
        setSectionNoFilter("all")
        setProcessFilter("all")
        setGlobalFilter("")
    }

    function handleExport() {
        const exportData = filteredData.map((row) => ({
            ID: row.zid,
            项目: row.project,
            车号: row.vehicleNo,
            节车号: row.sectionNo,
            工序: row.process,
            "EAS BOM": row.easBom ? "是" : "否",
            "EAS 工时": row.easWorkHours ? "是" : "否",
            "MES 派工单": row.mesDispatch ? "是" : "否",
            生产辅助工时: row.auxWorkHours ? "是" : "否",
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        ws["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "跨系统工序一致比对")
        XLSX.writeFile(wb, "跨系统工序一致比对.xlsx")
    }

    return (
        <div className="flex min-h-svh flex-col">
            <HeaderBar />
            <div className="flex flex-1 flex-col gap-4 p-6">
                <DataTableToolbar
                    searchValue={globalFilter}
                    onSearchChange={setGlobalFilter}
                    projectOptions={uniqueProjects}
                    projectFilter={projectFilter}
                    onProjectFilterChange={setProjectFilter}
                    vehicleNoFilter={vehicleNoFilter}
                    onVehicleNoFilterChange={setVehicleNoFilter}
                    sectionNoOptions={uniqueSectionNos}
                    sectionNoFilter={sectionNoFilter}
                    onSectionNoFilterChange={setSectionNoFilter}
                    processOptions={uniqueProcesses}
                    processFilter={processFilter}
                    onProcessFilterChange={setProcessFilter}
                    onClearFilters={clearFilters}
                    onExport={handleExport}
                    hasActiveFilters={hasActiveFilters}
                />
                <DataTable table={table} totalRows={filteredData.length} />
            </div>
        </div>
    )
}
