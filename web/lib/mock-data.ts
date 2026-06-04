import type { ProcessComparison } from "./types"

const projects = ["CR400AF", "CR300BF", "CRH380A", "CRH2G", "复兴号智能动车组"]
const processes = [
    "车体焊接",
    "底架组装",
    "侧墙组装",
    "车顶组装",
    "端墙组装",
    "转向架安装",
    "制动系统安装",
    "电气布线",
    "空调安装",
    "内装",
    "座椅安装",
    "地板铺设",
    "门窗安装",
    "涂装底漆",
    "涂装面漆",
    "标识粘贴",
    "管路连接",
    "线缆敷设",
    "绝缘测试",
    "耐压试验",
    "淋雨试验",
    "称重调平",
    "限界检测",
    "联调联试",
    "静态调试",
    "动态调试",
    "出厂验收",
    "整车落成",
    "编组连挂",
    "试运行",
]
const vehiclePrefixes: Record<string, string> = {
    CR400AF: "CR400AF-",
    CR300BF: "CR300BF-",
    CRH380A: "CRH380A-",
    CRH2G: "CRH2G-",
    复兴号智能动车组: "FXD-",
}

// 确定性伪随机数生成器 (mulberry32)
function seededRandom(seed: number): () => number {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function seededPick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)]
}

function generateRow(zid: number): ProcessComparison {
    const rng = seededRandom(zid * 7907 + 433)

    const project = seededPick(rng, projects)
    const vehicleNum = String(Math.floor(rng() * 50) + 1).padStart(2, "0")
    const vehicleNo = `${vehiclePrefixes[project]}${vehicleNum}`
    const sectionNo = `第${Math.floor(rng() * 8) + 1}节`

    const easBom = rng() > 0.15 ? 1 : 0
    const easWorkHours = easBom === 1 && rng() > 0.25 ? 1 : 0
    const mesDispatch = rng() > 0.35 ? 1 : 0
    const auxWorkHours = rng() > 0.4 ? 1 : 0

    return {
        zid,
        project,
        vehicleNo,
        sectionNo,
        process: seededPick(rng, processes),
        easBom,
        easWorkHours,
        mesDispatch,
        auxWorkHours,
    }
}

export const mockData: ProcessComparison[] = Array.from({ length: 230 }, (_, i) => generateRow(i + 1))
