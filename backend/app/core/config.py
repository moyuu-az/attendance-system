from pydantic_settings import BaseSettings
from typing import List
import os
import pathlib


class Settings(BaseSettings):
    """
    アプリケーション設定
    """
    # アプリケーション設定
    APP_NAME: str = "勤怠管理システム"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # データベース設定
    DB_TYPE: str = os.getenv("DB_TYPE", "postgresql")  # sqlite または postgresql
    
    def _get_database_url(self) -> str:
        """
        データベースタイプに応じたDATABASE_URLを生成
        """
        if self.DB_TYPE.lower() == "sqlite":
            # ユーザーホームディレクトリに.attendanceフォルダを作成
            home_dir = pathlib.Path.home()
            db_dir = home_dir / ".attendance"
            db_dir.mkdir(exist_ok=True)
            
            db_path = db_dir / "attendance.db"
            return f"sqlite:///{db_path}"
        else:
            # PostgreSQL (従来の設定)
            return os.getenv(
                "DATABASE_URL",
                "postgresql://user:password@database:5432/attendance_db"
            )
    
    @property
    def DATABASE_URL(self) -> str:
        """
        データベース接続URLを動的に生成
        """
        return self._get_database_url()
    
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