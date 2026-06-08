"use client"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Download, Search, X } from "lucide-react"

interface DataTableToolbarProps {
    searchValue: string
    onSearchChange: (value: string) => void
    projectFilter: string
    onProjectFilterChange: (value: string) => void
    projectAbbrFilter: string
    onProjectAbbrFilterChange: (value: string) => void
    vehicleNoFilter: string
    onVehicleNoFilterChange: (value: string) => void
    sectionNoFilter: string
    onSectionNoFilterChange: (value: string) => void
    processFilter: string
    onProcessFilterChange: (value: string) => void
    processNameFilter: string
    onProcessNameFilterChange: (value: string) => void
    onClearFilters: () => void
    onExport: () => void
    exporting?: boolean
    hasActiveFilters: boolean
}

export function DataTableToolbar({
    searchValue,
    onSearchChange,
    projectFilter,
    onProjectFilterChange,
    projectAbbrFilter,
    onProjectAbbrFilterChange,
    vehicleNoFilter,
    onVehicleNoFilterChange,
    sectionNoFilter,
    onSectionNoFilterChange,
    processFilter,
    onProcessFilterChange,
    processNameFilter,
    onProcessNameFilterChange,
    onClearFilters,
    onExport,
    exporting,
    hasActiveFilters,
}: DataTableToolbarProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <InputGroup className="w-full max-w-sm">
                    <InputGroupAddon align="inline-start">
                        <Search className="size-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput placeholder="全局搜索..." value={searchValue} onChange={(e) => onSearchChange(e.target.value)} />
                    {searchValue && (
                        <InputGroupAddon align="inline-end">
                            <Button variant="ghost" size="icon-sm" onClick={() => onSearchChange("")} aria-label="清除搜索">
                                <X className="size-3.5" />
                            </Button>
                        </InputGroupAddon>
                    )}
                </InputGroup>

                <FilterInput placeholder="项目筛选..." value={projectFilter} onChange={onProjectFilterChange} />
                <FilterInput placeholder="项目简称筛选..." value={projectAbbrFilter} onChange={onProjectAbbrFilterChange} />
                <FilterInput placeholder="车号筛选..." value={vehicleNoFilter} onChange={onVehicleNoFilterChange} />
                <FilterInput placeholder="节车号筛选..." value={sectionNoFilter} onChange={onSectionNoFilterChange} />
                <FilterInput placeholder="工序筛选..." value={processFilter} onChange={onProcessFilterChange} />
                <FilterInput placeholder="工序名称筛选..." value={processNameFilter} onChange={onProcessNameFilterChange} />

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
                        <X className="size-3.5" />
                        清除筛选
                    </Button>
                )}

                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
                        <Download className="size-3.5" />
                        {exporting ? "导出中..." : "导出Excel"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function FilterInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
    return (
        <InputGroup className="w-32">
            <InputGroupInput placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
            {value && (
                <InputGroupAddon align="inline-end">
                    <Button variant="ghost" size="icon-xs" onClick={() => onChange("")} aria-label="清除">
                        <X className="size-3" />
                    </Button>
                </InputGroupAddon>
            )}
        </InputGroup>
    )
}
