"use client"
"use no memo"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import type { ProcessComparison } from "@/lib/types"

export default function Page() {
  const [data, setData] = useState<ProcessComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility] = useState<VisibilityState>({})

  const [projectFilter, setProjectFilter] = useState("all")
  const [vehicleNoFilter, setVehicleNoFilter] = useState("")
  const [sectionNoFilter, setSectionNoFilter] = useState("all")
  const [processFilter, setProcessFilter] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/comparison")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ProcessComparison[] = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取数据失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const uniqueProjects = useMemo(() => [...new Set(data.map((d) => d.project))].sort(), [data])
  const uniqueSectionNos = useMemo(() => [...new Set(data.map((d) => d.sectionNo))].sort(), [data])
  const uniqueProcesses = useMemo(() => [...new Set(data.map((d) => d.process))].sort(), [data])

  const filteredData = useMemo(() => {
    return data.filter((row) => {
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
  }, [data, globalFilter, projectFilter, vehicleNoFilter, sectionNoFilter, processFilter])

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

  const hasActiveFilters =
    projectFilter !== "all" ||
    vehicleNoFilter !== "" ||
    sectionNoFilter !== "all" ||
    processFilter !== "all" ||
    globalFilter !== ""

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
    ws["!cols"] = [
      { wch: 6 }, { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ]

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

        {loading && (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            加载中...
          </div>
        )}

        {error && (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <p className="text-sm text-destructive">数据加载失败：{error}</p>
            <button
              onClick={fetchData}
              className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/80"
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && (
          <DataTable table={table} totalRows={filteredData.length} />
        )}
      </div>
    </div>
  )
}
