from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import users, attendance, breaks, reports

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションのライフサイクル管理
    """
    # 起動時の処理
    logger.info("Starting up application...")
    # データベーステーブルの作成
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # 終了時の処理
    logger.info("Shutting down application...")
    await engine.dispose()


# FastAPIアプリケーションの初期化
app = FastAPI(
    title="勤怠管理システム API",
    description="時給ベースの勤怠管理システム",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(breaks.router, prefix="/api/breaks", tags=["breaks"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])


@app.get("/")
async def root():
    """
    ルートエンドポイント - ヘルスチェック用
    """
    return {
        "message": "勤怠管理システム API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """
    ヘルスチェックエンドポイント
    """
    return {
        "status": "healthy",
        "database": "connected"
    }