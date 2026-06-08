import logging
import traceback

from litestar import Litestar, get
from litestar.config.cors import CORSConfig
from litestar.exceptions import HTTPException
from litestar.static_files import create_static_files_router
from pydantic import BaseModel
import clickhouse_connect
from clickhouse_connect.driver.client import Client

# ── 日志 ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("server")

# ── ClickHouse 连接配置 ────────────────────────────────
CH_HOST = "10.24.5.59"
CH_PORT = 8123
CH_USER = "cheakf"
CH_PASSWORD = "Swq8855830."

# ── 允许的排序字段白名单（防注入）──────────────────────
SORT_WHITELIST = {
    "zid", "project", "projectAbbr", "vehicleNo", "sectionNo", "process", "processName",
    "easOrder", "easWorkHours", "mesDispatch", "easBom",
}

COLUMN_SQL_MAP = {
    "zid":           "zid",
    "project":       "`项目`",
    "projectAbbr":   "`项目简称`",
    "vehicleNo":     "`车号`",
    "sectionNo":     "`节车号`",
    "process":       "`工序`",
    "processName":   "`工序名称`",
    "easOrder":      "`EAS生产订单中是否存在`",
    "easWorkHours":  "`EAS工时中是否存在`",
    "mesDispatch":   "`MES排程中是否存在`",
    "easBom":        "`EASBOM中是否存在`",
}


class ComparisonRecord(BaseModel):
    zid: int
    project: str
    projectAbbr: str
    vehicleNo: str
    sectionNo: str
    process: str
    processName: str
    easOrder: int
    easWorkHours: int
    mesDispatch: int
    easBom: int


class ComparisonResponse(BaseModel):
    data: list[ComparisonRecord]
    total: int
    page: int
    pageSize: int


# ── 连接池 ─────────────────────────────────────────────
_ch_client: Client | None = None


def get_ch_client() -> Client:
    global _ch_client
    if _ch_client is None:
        _ch_client = clickhouse_connect.get_client(
            host=CH_HOST,
            port=CH_PORT,
            username=CH_USER,
            password=CH_PASSWORD,
            connect_timeout=10,
            send_receive_timeout=300,
        )
        logger.info(f"ClickHouse 连接池已创建: {CH_HOST}:{CH_PORT}")
    return _ch_client


def build_where_clause(
    search: str | None,
    project: str | None,
    projectAbbr: str | None,
    vehicleNo: str | None,
    sectionNo: str | None,
    process: str | None,
    processName: str | None,
) -> tuple[str, dict]:
    """构建 WHERE 子句和参数。返回 (sql, params_dict)。"""
    conditions: list[str] = []
    params: dict[str, str] = {}

    if search:
        conditions.append(
            "("
            "  `项目`   LIKE {search:String} OR "
            "  `项目简称` LIKE {search:String} OR "
            "  `车号`   LIKE {search:String} OR "
            "  `节车号` LIKE {search:String} OR "
            "  `工序`   LIKE {search:String} OR "
            "  `工序名称` LIKE {search:String}"
            ")"
        )
        params["search"] = f"%{search}%"

    if project:
        conditions.append("`项目` LIKE {project:String}")
        params["project"] = f"%{project}%"

    if projectAbbr:
        conditions.append("`项目简称` LIKE {projectAbbr:String}")
        params["projectAbbr"] = f"%{projectAbbr}%"

    if vehicleNo:
        conditions.append("`车号` LIKE {vehicleNo:String}")
        params["vehicleNo"] = f"%{vehicleNo}%"

    if sectionNo:
        conditions.append("`节车号` LIKE {sectionNo:String}")
        params["sectionNo"] = f"%{sectionNo}%"

    if process:
        conditions.append("`工序` LIKE {process:String}")
        params["process"] = f"%{process}%"

    if processName:
        conditions.append("`工序名称` LIKE {processName:String}")
        params["processName"] = f"%{processName}%"

    if conditions:
        return " WHERE " + " AND ".join(conditions), params
    return "", {}


@get("/api/comparison")
async def get_comparison_data(
    page: int = 1,
    pageSize: int = 30,
    search: str | None = None,
    project: str | None = None,
    projectAbbr: str | None = None,
    vehicleNo: str | None = None,
    sectionNo: str | None = None,
    process: str | None = None,
    processName: str | None = None,
    sortField: str = "zid",
    sortOrder: str = "asc",
    all: int = 0,
) -> ComparisonResponse:
    """返回跨系统工序一致比对数据（服务端分页/筛选/排序）。
    all=1 时忽略分页，返回全部筛选结果（用于导出）。"""
    export_mode = all == 1
    logger.info(
        f"收到请求 page={page} pageSize={pageSize} export={export_mode} search={search!r} "
        f"project={project!r} projectAbbr={projectAbbr!r} vehicleNo={vehicleNo!r} sectionNo={sectionNo!r} "
        f"process={process!r} processName={processName!r} sort={sortField} {sortOrder}"
    )

    if sortField not in SORT_WHITELIST:
        sortField = "zid"
    sort_order_sql = "DESC" if sortOrder.lower() == "desc" else "ASC"
    sort_col = COLUMN_SQL_MAP[sortField]

    where_sql, params = build_where_clause(search, project, projectAbbr, vehicleNo, sectionNo, process, processName)

    try:
        client = get_ch_client()
    except Exception as e:
        logger.error(f"获取 ClickHouse 客户端失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=503, detail=f"数据库连接异常: {e}")

    # ── 导出模式：不分页，返回全部筛选数据 ──
    if export_mode:
        data_sql = f"""
            SELECT
                zid,
                `项目`     AS project,
                `项目简称` AS projectAbbr,
                `车号`     AS vehicleNo,
                `节车号`   AS sectionNo,
                `工序`     AS process,
                `工序名称` AS processName,
                `EAS生产订单中是否存在`        AS easOrder,
                `EAS工时中是否存在`            AS easWorkHours,
                `MES排程中是否存在`             AS mesDispatch,
                `EASBOM中是否存在`              AS easBom
        FROM dwd.comparison_of_process_work_hours
        {where_sql}
        ORDER BY {sort_col} {sort_order_sql}
    """
    try:
        logger.info("执行导出查询（无分页）")
        df = client.query_df(data_sql, parameters=params)
        total = len(df)
        logger.info(f"导出 {total} 行")
    except Exception as e:
        logger.error(f"导出查询失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"导出查询失败: {e}")

        df = df.where(df.notna(), None)
        records = _df_to_records(df)
        return ComparisonResponse(data=records, total=total, page=1, pageSize=total)

    # ── 分页模式 ──
    page = max(page, 1)
    pageSize = min(max(pageSize, 1), 100)
    offset = (page - 1) * pageSize

    count_sql = f"SELECT count() AS cnt FROM dwd.comparison_of_process_work_hours{where_sql}"
    try:
        cnt_df = client.query_df(count_sql, parameters=params)
        total = int(cnt_df.iloc[0]["cnt"])
        logger.info(f"COUNT 结果: {total} 行")
    except Exception as e:
        logger.error(f"COUNT 查询失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"总数查询失败: {e}")

    if total == 0:
        return ComparisonResponse(data=[], total=0, page=page, pageSize=pageSize)

    data_sql = f"""
        SELECT
            zid,
            `项目`     AS project,
            `项目简称` AS projectAbbr,
            `车号`     AS vehicleNo,
            `节车号`   AS sectionNo,
            `工序`     AS process,
            `工序名称` AS processName,
            `EAS生产订单中是否存在`        AS easOrder,
            `EAS工时中是否存在`            AS easWorkHours,
            `MES排程中是否存在`             AS mesDispatch,
            `EASBOM中是否存在`              AS easBom
    FROM dwd.comparison_of_process_work_hours
    {where_sql}
    ORDER BY {sort_col} {sort_order_sql}
    LIMIT {pageSize} OFFSET {offset}
    """
    try:
        logger.info(f"执行数据查询 offset={offset} limit={pageSize}")
        df = client.query_df(data_sql, parameters=params)
        logger.info(f"返回 {len(df)} 行")
    except Exception as e:
        logger.error(f"数据查询失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"数据查询失败: {e}")

    df = df.where(df.notna(), None)
    records = _df_to_records(df)

    logger.info(f"响应: {len(records)} 条 / 共 {total} 条")
    return ComparisonResponse(data=records, total=total, page=page, pageSize=pageSize)


def _df_to_records(df) -> list[ComparisonRecord]:
    """DataFrame → ComparisonRecord 列表。"""
    return [
        ComparisonRecord(
            zid=int(row["zid"]),
            project=str(row["project"]),
            projectAbbr=str(row["projectAbbr"]),
            vehicleNo=str(row["vehicleNo"]),
            sectionNo=str(row["sectionNo"]),
            process=str(row["process"]),
            processName=str(row["processName"]),
            easOrder=int(row["easOrder"]),
            easWorkHours=int(row["easWorkHours"]),
            mesDispatch=int(row["mesDispatch"]),
            easBom=int(row["easBom"]),
        )
        for row in df.to_dict(orient="records")
    ]


# ── 应用 ───────────────────────────────────────────────
cors_config = CORSConfig(
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    allow_credentials=False,
)

static_router = create_static_files_router(
    path="/",
    directories=["static"],
    name="static",
    html_mode=True,
    include_in_schema=False,
)

app = Litestar(
    route_handlers=[get_comparison_data, static_router],
    cors_config=cors_config,
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=12376, log_level="info")
