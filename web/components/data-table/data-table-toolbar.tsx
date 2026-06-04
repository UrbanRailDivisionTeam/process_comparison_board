"use client"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Search, X } from "lucide-react"

interface DataTableToolbarProps {
    searchValue: string
    onSearchChange: (value: string) => void
    projectOptions: string[]
    projectFilter: string
    onProjectFilterChange: (value: string) => void
    vehicleNoFilter: string
    onVehicleNoFilterChange: (value: string) => void
    sectionNoOptions: string[]
    sectionNoFilter: string
    onSectionNoFilterChange: (value: string) => void
    processOptions: string[]
    processFilter: string
    onProcessFilterChange: (value: string) => void
    onClearFilters: () => void
    onExport: () => void
    hasActiveFilters: boolean
}

export function DataTableToolbar({
    searchValue,
    onSearchChange,
    projectOptions,
    projectFilter,
    onProjectFilterChange,
    vehicleNoFilter,
    onVehicleNoFilterChange,
    sectionNoOptions,
    sectionNoFilter,
    onSectionNoFilterChange,
    processOptions,
    processFilter,
    onProcessFilterChange,
    onClearFilters,
    onExport,
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

                <Select value={projectFilter} onValueChange={onProjectFilterChange}>
                    <SelectTrigger className="h-8 w-45 text-sm">
                        <SelectValue placeholder="项目" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部项目</SelectItem>
                        {projectOptions.map((p) => (
                            <SelectItem key={p} value={p}>
                                {p}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <InputGroup className="w-36">
                    <InputGroupInput placeholder="车号筛选..." value={vehicleNoFilter} onChange={(e) => onVehicleNoFilterChange(e.target.value)} />
                    {vehicleNoFilter && (
                        <InputGroupAddon align="inline-end">
                            <Button variant="ghost" size="icon-xs" onClick={() => onVehicleNoFilterChange("")} aria-label="清除车号">
                                <X className="size-3" />
                            </Button>
                        </InputGroupAddon>
                    )}
                </InputGroup>

                <Select value={sectionNoFilter} onValueChange={onSectionNoFilterChange}>
                    <SelectTrigger className="h-8 w-28 text-sm">
                        <SelectValue placeholder="节车号" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        {sectionNoOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={processFilter} onValueChange={onProcessFilterChange}>
                    <SelectTrigger className="h-8 w-36 text-sm">
                        <SelectValue placeholder="工序" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部工序</SelectItem>
                        {processOptions.map((p) => (
                            <SelectItem key={p} value={p}>
                                {p}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
                        <X className="size-3.5" />
                        清除筛选
                    </Button>
                )}

                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="size-3.5" />
                        导出Excel
                    </Button>
                </div>
            </div>
        </div>
    )
}
