from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 同期エンジンの作成
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True
)

# 同期セッションファクトリーの作成
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ベースクラスの定義
Base = declarative_base()


def get_db() -> Generator:
    """
    データベースセッションの依存性注入用関数
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()