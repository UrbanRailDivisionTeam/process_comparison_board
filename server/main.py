from litestar import Litestar, get
from litestar.config.cors import CORSConfig
from pydantic import BaseModel
import clickhouse_connect

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
    return clickhouse_connect.get_client(
        host=CH_HOST,
        port=CH_PORT,
        username=CH_USER,
        password=CH_PASSWORD,
    )


@get("/api/comparison")
async def get_comparison_data() -> list[ComparisonRecord]:
    client = get_ch_client()
    sql = """
        SELECT
            zid,
            项目   AS project,
            车号   AS vehicleNo,
            节车号 AS sectionNo,
            工序   AS process,
            EASBOM中是否存在            AS easBom,
            EAS工时中是否存在            AS easWorkHours,
            MES派工单中是否存在           AS mesDispatch,
            生产辅助系统工时中是否存在    AS auxWorkHours
        FROM dwd.comparison_of_process_work_hours
        ORDER BY zid
    """
    df = client.query_df(sql)
    # pandas NaN → Python int/str 确保 pydantic 序列化正确
    df = df.fillna({"easBom": 0, "easWorkHours": 0, "mesDispatch": 0, "auxWorkHours": 0})
    records = [ComparisonRecord(**row) for row in df.to_dict(orient="records")]
    return records


cors_config = CORSConfig(allow_origins=["*"], allow_methods=["GET"])

app = Litestar(
    route_handlers=[get_comparison_data],
    cors_config=cors_config,
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=12376)
