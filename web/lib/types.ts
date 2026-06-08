export interface ProcessComparison {
    zid: number
    project: string // 项目
    projectAbbr: string // 项目简称
    vehicleNo: string // 车号
    sectionNo: string // 节车号
    process: string // 工序
    easOrder: number // EAS生产订单中是否存在 (0/1)
    easWorkHours: number // EAS工时中是否存在 (0/1)
    mesDispatch: number // MES排程中是否存在 (0/1)
    easBom: number // EASBOM中是否存在 (0/1)
}

export interface ComparisonApiResponse {
    data: ProcessComparison[]
    total: number
    page: number
    pageSize: number
}
