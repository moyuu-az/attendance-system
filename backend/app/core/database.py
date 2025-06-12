from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator, AsyncGenerator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_async_database_url() -> str:
    """
    データベースタイプに応じた非同期データベースURLを生成
    """
    database_url = settings.DATABASE_URL
    
    if settings.DB_TYPE.lower() == "sqlite":
        # SQLite用の非同期ドライバを使用
        return database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
    else:
        # PostgreSQL用の非同期ドライバを使用
        return database_url.replace("postgresql://", "postgresql+asyncpg://")

# 非同期エンジンの作成
async_database_url = _get_async_database_url()

# SQLite用の特別な設定
engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True
}

# SQLiteの場合は接続プールを無効にする
if settings.DB_TYPE.lower() == "sqlite":
    engine_kwargs.update({
        "pool_pre_ping": False,
        "poolclass": None
    })

async_engine = create_async_engine(async_database_url, **engine_kwargs)

# 非同期セッションファクトリーの作成
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

# 同期エンジンの作成（マイグレーション用）
sync_engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True
}

# SQLiteの場合は同期エンジンでも特別な設定
if settings.DB_TYPE.lower() == "sqlite":
    sync_engine_kwargs.update({
        "pool_pre_ping": False,
        "poolclass": None
    })

sync_engine = create_engine(settings.DATABASE_URL, **sync_engine_kwargs)

# ベースクラスの定義
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    非同期データベースセッションの依存性注入用関数
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db() -> Generator:
    """
    同期データベースセッションの依存性注入用関数（マイグレーション用）
    """
    from sqlalchemy.orm import sessionmaker as sync_sessionmaker
    SyncSessionLocal = sync_sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=sync_engine
    )
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


async def create_tables():
    """
    データベーステーブルを作成する関数
    """
    try:
        # モデルをインポートしてテーブル定義を読み込む
        from app.models import user, attendance, break_time
        
        logger.info(f"Creating tables for {settings.DB_TYPE} database...")
        
        if settings.DB_TYPE.lower() == "sqlite":
            # SQLiteの場合は同期的にテーブルを作成
            Base.metadata.create_all(bind=sync_engine)
            logger.info("SQLite database tables created successfully")
        else:
            # PostgreSQLの場合は非同期でテーブルを作成
            async with async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("PostgreSQL database tables created successfully")
            
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


def initialize_database():
    """
    データベースの初期化を行う関数（同期版）
    """
    try:
        # モデルをインポートしてテーブル定義を読み込む
        from app.models import user, attendance, break_time
        
        logger.info(f"Initializing {settings.DB_TYPE} database...")
        
        # テーブルを作成
        Base.metadata.create_all(bind=sync_engine)
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise