from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator, AsyncGenerator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 非同期エンジンの作成
# DATABASE_URLをasyncpg用に変換
async_database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async_engine = create_async_engine(
    async_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True
)

# 非同期セッションファクトリーの作成
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

# 同期エンジンの作成（マイグレーション用）
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True
)

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