from pydantic import BaseModel, Field
from typing import Optional
from datetime import time, datetime


class BreakTimeBase(BaseModel):
    """
    休憩時間基本スキーマ
    """
    start_time: time
    end_time: Optional[time] = None


class BreakTimeCreate(BreakTimeBase):
    """
    休憩時間作成用スキーマ
    """
    attendance_id: int


class BreakTimeUpdate(BaseModel):
    """
    休憩時間更新用スキーマ
    """
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class BreakTimeResponse(BreakTimeBase):
    """
    休憩時間レスポンススキーマ
    """
    id: int
    attendance_id: int
    duration: int = Field(default=0, description="休憩時間（分）")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BreakStartRequest(BaseModel):
    """
    休憩開始リクエストスキーマ
    """
    attendance_id: int
    time: Optional[time] = None  # Noneの場合は現在時刻


class BreakEndRequest(BaseModel):
    """
    休憩終了リクエストスキーマ
    """
    break_id: int
    time: Optional[time] = None  # Noneの場合は現在時刻


class BreakErrorResponse(BaseModel):
    """
    休憩時間エラーレスポンススキーマ
    """
    detail: str
    error_code: str
    error_type: str = "break_error"
    timestamp: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Previous break not ended",
                "error_code": "BREAK_NOT_ENDED",
                "error_type": "break_error",
                "timestamp": "2024-01-01T10:00:00"
            }
        }