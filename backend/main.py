from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import sync_engine, Base, initialize_database
from app.api.routes import users, attendance, breaks, reports

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# FastAPIアプリケーションの初期化
app = FastAPI(
    title="勤怠管理システム API",
    description="時給ベースの勤怠管理システム",
    version="1.0.0"
)


@app.on_event("startup")
def startup_event():
    """
    アプリケーション起動時の処理
    """
    logger.info("Starting up application...")
    logger.info(f"Database type: {settings.DB_TYPE}")
    logger.info(f"Database URL: {settings.DATABASE_URL}")
    
    # データベースの初期化
    try:
        initialize_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


@app.on_event("shutdown")
def shutdown_event():
    """
    アプリケーション終了時の処理
    """
    logger.info("Shutting down application...")
    sync_engine.dispose()

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