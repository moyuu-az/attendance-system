from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, and_, func
from sqlalchemy.orm import selectinload
from decimal import Decimal
from typing import List, Dict
import logging
from calendar import monthrange

from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.reports import MonthlyReport, YearlyReport

logger = logging.getLogger(__name__)


class ReportService:
    """
    レポート生成サービス
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_monthly_report(
        self,
        user_id: int,
        year: int,
        month: int
    ) -> MonthlyReport:
        """
        月次レポートを生成
        """
        # 月の勤怠データを取得
        result = await self.db.execute(
            select(Attendance)
            .where(and_(
                Attendance.user_id == user_id,
                extract('year', Attendance.date) == year,
                extract('month', Attendance.date) == month
            ))
            .options(selectinload(Attendance.break_times))
            .order_by(Attendance.date)
        )
        attendances = result.scalars().all()
        
        # 集計
        total_days = len(attendances)
        total_hours = sum(a.total_hours or Decimal("0") for a in attendances)
        total_amount = sum(a.total_amount or Decimal("0") for a in attendances)
        
        # 平均日次労働時間
        average_daily_hours = (
            total_hours / total_days if total_days > 0
            else Decimal("0")
        )
        
        return MonthlyReport(
            year=year,
            month=month,
            total_days=total_days,
            total_hours=total_hours,
            total_amount=total_amount,
            average_daily_hours=average_daily_hours,
            attendance_list=attendances
        )
    
    async def get_yearly_report(
        self,
        user_id: int,
        year: int
    ) -> YearlyReport:
        """
        年次レポートを生成
        """
        # 年間の勤怠データを月別に集計
        monthly_summary = []
        total_yearly_days = 0
        total_yearly_hours = Decimal("0")
        total_yearly_amount = Decimal("0")
        
        for month in range(1, 13):
            # 月次データ取得
            result = await self.db.execute(
                select(
                    func.count(Attendance.id).label('days'),
                    func.sum(Attendance.total_hours).label('hours'),
                    func.sum(Attendance.total_amount).label('amount')
                )
                .where(and_(
                    Attendance.user_id == user_id,
                    extract('year', Attendance.date) == year,
                    extract('month', Attendance.date) == month
                ))
            )
            monthly_data = result.first()
            
            days = monthly_data.days or 0
            hours = monthly_data.hours or Decimal("0")
            amount = monthly_data.amount or Decimal("0")
            
            if days > 0:
                monthly_summary.append({
                    "month": month,
                    "total_days": days,
                    "total_hours": float(hours),
                    "total_amount": float(amount),
                    "average_daily_hours": float(hours / days)
                })
            
            total_yearly_days += days
            total_yearly_hours += hours
            total_yearly_amount += amount
        
        return YearlyReport(
            year=year,
            total_days=total_yearly_days,
            total_hours=total_yearly_hours,
            total_amount=total_yearly_amount,
            monthly_summary=monthly_summary
        )