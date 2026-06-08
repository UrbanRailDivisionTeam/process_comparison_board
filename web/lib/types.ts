export interface ProcessComparison {
    zid: number
    project: string // 项目
    projectAbbr: string // 项目简称
    vehicleNo: string // 车号
    sectionNo: string // 节车号
    process: string // 工序
    easBom: number // EASBOM中是否存在 (0/1)
    easWorkHours: number // EAS工时中是否存在 (0/1)
    mesDispatch: number // MES中排程是否存在 (0/1)
    auxWorkHours: number // 生产辅助系统工时中是否存在 (0/1)
}

export interface ComparisonApiResponse {
    data: ProcessComparison[]
    total: number
    page: number
    pageSize: number
}
