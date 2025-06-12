from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """
    アプリケーション設定
    """
    # アプリケーション設定
    APP_NAME: str = "勤怠管理システム"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # データベース設定
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@database:5432/attendance_db"
    )
    
    # CORS設定
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://frontend:3000",
        "http://127.0.0.1:3000",
        "*"  # 開発環境でのテスト用（本番では削除する）
    ]
    
    # JWT設定（簡易実装用）
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24時間
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# シングルトンインスタンス
settings = Settings()