"use client"
"use no memo"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import * as XLSX from "xlsx"

import { columns } from "@/components/data-table/columns"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { HeaderBar } from "@/components/header-bar"
import type { ComparisonApiResponse, ProcessComparison } from "@/lib/types"

export default function Page() {
  // ── 筛选状态（全部为字符串模糊筛选）───────────────
  const [globalFilter, setGlobalFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [vehicleNoFilter, setVehicleNoFilter] = useState("")
  const [sectionNoFilter, setSectionNoFilter] = useState("")
  const [processFilter, setProcessFilter] = useState("")

  // ── 表格状态（服务端）─────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 30 })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility] = useState<VisibilityState>({})
  const [rowCount, setRowCount] = useState(0)

  // ── 数据 & 加载 ──────────────────────────────────
  const [data, setData] = useState<ProcessComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ── 筛选去抖 ──────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  type FetchParams = {
    page: number
    pageSize: number
    search: string
    project: string
    vehicleNo: string
    sectionNo: string
    process: string
    sortField: string
    sortOrder: string
  }

  const fetchData = useCallback(async (params: FetchParams) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const q = new URLSearchParams()
    q.set("page", String(params.page))
    q.set("pageSize", String(params.pageSize))
    if (params.search) q.set("search", params.search)
    if (params.project) q.set("project", params.project)
    if (params.vehicleNo) q.set("vehicleNo", params.vehicleNo)
    if (params.sectionNo) q.set("sectionNo", params.sectionNo)
    if (params.process) q.set("process", params.process)
    q.set("sortField", params.sortField)
    q.set("sortOrder", params.sortOrder)

    try {
      const res = await fetch(`/api/comparison?${q}`, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ComparisonApiResponse = await res.json()
      if (!controller.signal.aborted) {
        setData(json.data)
        setRowCount(json.total)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "获取数据失败")
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  // ── 筛选/分页/排序变化 → 触发 API 请求 ──────────
  const buildParams = useCallback((): FetchParams => {
    const sortField = sorting[0]?.id ?? "zid"
    const sortOrder = sorting[0]?.desc ?? false ? "desc" : "asc"
    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: globalFilter,
      project: projectFilter,
      vehicleNo: vehicleNoFilter,
      sectionNo: sectionNoFilter,
      process: processFilter,
      sortField,
      sortOrder,
    }
  }, [pagination, sorting, globalFilter, projectFilter, vehicleNoFilter, sectionNoFilter, processFilter])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchData(buildParams())
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [buildParams, fetchData])

  // ── useReactTable（manual 模式）───────────────────
  const table = useReactTable<ProcessComparison>({
    data,
    columns,
    rowCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
  })

  const hasActiveFilters =
    projectFilter !== "" ||
    vehicleNoFilter !== "" ||
    sectionNoFilter !== "" ||
    processFilter !== "" ||
    globalFilter !== ""

  function clearFilters() {
    setProjectFilter("")
    setVehicleNoFilter("")
    setSectionNoFilter("")
    setProcessFilter("")
    setGlobalFilter("")
  }

  function handleExport() {
    const exportData = data.map((row) => ({
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
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          vehicleNoFilter={vehicleNoFilter}
          onVehicleNoFilterChange={setVehicleNoFilter}
          sectionNoFilter={sectionNoFilter}
          onSectionNoFilterChange={setSectionNoFilter}
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
              onClick={() => fetchData(buildParams())}
              className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/80"
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && (
          <DataTable table={table} totalRows={rowCount} />
        )}
      </div>
    </div>
  )
}
