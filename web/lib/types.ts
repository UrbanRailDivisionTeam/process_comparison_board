export interface ProcessComparison {
    zid: number
    project: string // 项目
    vehicleNo: string // 车号
    sectionNo: string // 节车号
    process: string // 工序
    easBom: number // EASBOM中是否存在 (0/1)
    easWorkHours: number // EAS工时中是否存在 (0/1)
    mesDispatch: number // MES派工单中是否存在 (0/1)
    auxWorkHours: number // 生产辅助系统工时中是否存在 (0/1)
}

export interface ComparisonApiResponse {
    data: ProcessComparison[]
    total: number
    page: number
    pageSize: number
}

export interface FilterOptions {
    projects: string[]
    sectionNos: string[]
    processes: string[]
}
