from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from decimal import Decimal

from app.schemas.break_time import BreakTimeResponse


class AttendanceBase(BaseModel):
    """
    勤怠基本スキーマ
    """
    date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None


class AttendanceCreate(AttendanceBase):
    """
    勤怠作成用スキーマ
    """
    user_id: int


class AttendanceUpdate(BaseModel):
    """
    勤怠更新用スキーマ
    """
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None


class AttendanceResponse(AttendanceBase):
    """
    勤怠レスポンススキーマ
    """
    id: int
    user_id: int
    total_hours: Decimal = Field(default=Decimal("0"), decimal_places=2)
    total_amount: Decimal = Field(default=Decimal("0"), decimal_places=2)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AttendanceWithBreaks(AttendanceResponse):
    """
    休憩時間を含む勤怠レスポンススキーマ
    """
    break_times: List[BreakTimeResponse] = []


class ClockInRequest(BaseModel):
    """
    出勤リクエストスキーマ
    """
    user_id: int
    time: Optional[time] = None  # Noneの場合は現在時刻


class ClockOutRequest(BaseModel):
    """
    退勤リクエストスキーマ
    """
    user_id: int
    time: Optional[time] = None  # Noneの場合は現在時刻