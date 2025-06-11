from pydantic import BaseModel, Field
from typing import List
from decimal import Decimal
from datetime import date

from app.schemas.attendance import AttendanceWithBreaks


class MonthlyReport(BaseModel):
    """
    月次レポートスキーマ
    """
    year: int
    month: int
    total_days: int = Field(description="出勤日数")
    total_hours: Decimal = Field(decimal_places=2, description="総労働時間")
    total_amount: Decimal = Field(decimal_places=2, description="総支給額")
    average_daily_hours: Decimal = Field(decimal_places=2, description="平均日次労働時間")
    attendance_list: List[AttendanceWithBreaks] = Field(description="勤怠詳細リスト")


class YearlyReport(BaseModel):
    """
    年次レポートスキーマ
    """
    year: int
    total_days: int = Field(description="年間出勤日数")
    total_hours: Decimal = Field(decimal_places=2, description="年間総労働時間")
    total_amount: Decimal = Field(decimal_places=2, description="年間総支給額")
    monthly_summary: List[dict] = Field(description="月別サマリー")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            date: lambda v: v.isoformat()
        }