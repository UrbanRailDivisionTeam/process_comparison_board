import logging
import traceback

from litestar import Litestar, Request, get
from litestar.config.cors import CORSConfig
from litestar.exceptions import HTTPException
from litestar.static_files import create_static_files_router
from pydantic import BaseModel
import clickhouse_connect

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


class ComparisonRecord(BaseModel):
    zid: int
    project: str
    vehicleNo: str
    sectionNo: str
    process: str
    easBom: int
    easWorkHours: int
    mesDispatch: int
    auxWorkHours: int


def get_ch_client():
    """创建 ClickHouse 客户端，失败时抛出明确异常。"""
    try:
        client = clickhouse_connect.get_client(
            host=CH_HOST,
            port=CH_PORT,
            username=CH_USER,
            password=CH_PASSWORD,
            connect_timeout=10,
            send_receive_timeout=30,
        )
        logger.info(f"ClickHouse 连接成功: {CH_HOST}:{CH_PORT}")
        return client
    except Exception as e:
        logger.error(f"ClickHouse 连接失败: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"无法连接数据库 {CH_HOST}:{CH_PORT}: {e}",
        )


@get("/api/comparison")
async def get_comparison_data() -> list[ComparisonRecord]:
    """返回跨系统工序一致比对数据。"""
    logger.info("收到 /api/comparison 请求")

    try:
        client = get_ch_client()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取 ClickHouse 客户端失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=503, detail=f"数据库连接异常: {e}")

    sql = """
        SELECT
            zid,
            `项目`   AS project,
            `车号`   AS vehicleNo,
            `节车号` AS sectionNo,
            `工序`   AS process,
            `EASBOM中是否存在`            AS easBom,
            `EAS工时中是否存在`            AS easWorkHours,
            `MES派工单中是否存在`           AS mesDispatch,
            `生产辅助系统工时中是否存在`    AS auxWorkHours
        FROM dwd.comparison_of_process_work_hours
        ORDER BY zid
    """

    try:
        logger.info(f"执行查询: {sql.strip()[:120]}...")
        df = client.query_df(sql)
        logger.info(f"查询返回 {len(df)} 行")
    except Exception as e:
        logger.error(f"ClickHouse 查询失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=502, detail=f"数据库查询失败: {e}")

    try:
        df = df.where(df.notna(), None)
        records = [
            ComparisonRecord(
                zid=int(row["zid"]),
                project=str(row["project"]),
                vehicleNo=str(row["vehicleNo"]),
                sectionNo=str(row["sectionNo"]),
                process=str(row["process"]),
                easBom=int(row["easBom"]),
                easWorkHours=int(row["easWorkHours"]),
                mesDispatch=int(row["mesDispatch"]),
                auxWorkHours=int(row["auxWorkHours"]),
            )
            for row in df.to_dict(orient="records")
        ]
    except Exception as e:
        logger.error(f"数据转换失败:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"数据转换异常: {e}")

    logger.info(f"成功返回 {len(records)} 条记录")
    return records


# ── 全局异常处理 ───────────────────────────────────────
def global_exception_handler(request: Request, exc: Exception) -> dict:
    logger.error(f"未捕获异常 {request.url}:\n{traceback.format_exc()}")
    return {
        "detail": str(exc),
        "error_type": type(exc).__name__,
        "traceback": traceback.format_exc(),
    }


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
    exception_handlers={Exception: global_exception_handler},
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=12376, log_level="info")
