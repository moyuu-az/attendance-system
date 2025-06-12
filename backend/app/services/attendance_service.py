from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Optional, List
from calendar import monthrange
import logging

from app.models.attendance import Attendance
from app.models.user import User
from app.models.break_time import BreakTime
from app.utils.timezone import today_jst, now_time_jst, combine_date_time_jst

logger = logging.getLogger(__name__)


class AttendanceService:
    """
    勤怠管理サービス
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def clock_in(
        self,
        user_id: int,
        clock_in_time: Optional[time] = None
    ) -> Attendance:
        """
        出勤処理
        """
        # ユーザー存在確認
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        today = today_jst()
        current_time = clock_in_time or now_time_jst()
        
        # 既存の勤怠記録確認
        result = await self.db.execute(
            select(Attendance).where(and_(
                Attendance.user_id == user_id,
                Attendance.date == today
            ))
        )
        attendance = result.scalar_one_or_none()
        
        if attendance:
            # 既に出勤している場合は更新
            if attendance.clock_in:
                logger.warning(f"User {user_id} already clocked in today")
            attendance.clock_in = current_time
        else:
            # 新規作成
            attendance = Attendance(
                user_id=user_id,
                date=today,
                clock_in=current_time
            )
            self.db.add(attendance)
        
        await self.db.commit()
        await self.db.refresh(attendance)
        
        logger.info(f"User {user_id} clocked in at {current_time}")
        return attendance
    
    async def clock_out(
        self,
        user_id: int,
        clock_out_time: Optional[time] = None
    ) -> Attendance:
        """
        退勤処理
        """
        today = today_jst()
        current_time = clock_out_time or now_time_jst()
        
        # 今日の勤怠記録取得
        result = await self.db.execute(
            select(Attendance).where(and_(
                Attendance.user_id == user_id,
                Attendance.date == today
            ))
        )
        attendance = result.scalar_one_or_none()
        
        if not attendance:
            raise ValueError("No clock-in record found for today")
        
        if not attendance.clock_in:
            raise ValueError("Cannot clock out without clocking in first")
        
        attendance.clock_out = current_time
        
        # 労働時間と金額の計算
        await self.calculate_totals(attendance)
        
        await self.db.commit()
        await self.db.refresh(attendance)
        
        logger.info(f"User {user_id} clocked out at {current_time}")
        return attendance
    
    async def calculate_totals(self, attendance: Attendance) -> None:
        """
        労働時間と金額を計算
        """
        if not attendance.clock_in or not attendance.clock_out:
            return
        
        # 基本労働時間の計算（分単位）
        clock_in_dt = datetime.combine(attendance.date, attendance.clock_in)
        clock_out_dt = datetime.combine(attendance.date, attendance.clock_out)
        
        # 日跨ぎ対応
        if clock_out_dt < clock_in_dt:
            clock_out_dt += timedelta(days=1)
        
        total_minutes = (clock_out_dt - clock_in_dt).total_seconds() / 60
        
        # 休憩時間の取得と差し引き
        result = await self.db.execute(
            select(BreakTime)
            .where(BreakTime.attendance_id == attendance.id)
        )
        breaks = result.scalars().all()
        
        total_break_minutes = sum(
            b.duration for b in breaks if b.duration
        )
        
        # 実労働時間（時間単位）
        work_minutes = total_minutes - total_break_minutes
        work_hours = Decimal(str(work_minutes / 60))
        
        # ユーザーの時給取得
        user = await self.db.get(User, attendance.user_id)
        if user:
            total_amount = work_hours * user.hourly_rate
        else:
            total_amount = Decimal("0")
        
        # 更新
        attendance.total_hours = work_hours
        attendance.total_amount = total_amount
        
        logger.info(
            f"Calculated totals for attendance {attendance.id}: "
            f"{work_hours} hours, {total_amount} yen"
        )
    
    async def get_monthly_calendar(
        self,
        user_id: int,
        year: int,
        month: int
    ) -> List[dict]:
        """
        月間カレンダー形式で勤怠データを取得
        """
        from app.schemas.attendance import CalendarDay, AttendanceWithBreaks
        
        # 月の全日程を生成
        _, last_day = monthrange(year, month)
        all_dates = [date(year, month, day) for day in range(1, last_day + 1)]
        
        # 該当月の勤怠データを一括取得
        result = await self.db.execute(
            select(Attendance)
            .options(selectinload(Attendance.break_times))
            .where(and_(
                Attendance.user_id == user_id,
                Attendance.date >= date(year, month, 1),
                Attendance.date <= date(year, month, last_day)
            ))
        )
        attendances = result.scalars().all()
        attendance_dict = {a.date: a for a in attendances}
        
        # カレンダーデータを構築
        calendar_days = []
        for current_date in all_dates:
            day_of_week = current_date.weekday()  # 0=月曜, 6=日曜
            is_weekend = day_of_week >= 5  # 土日
            attendance = attendance_dict.get(current_date)
            
            # ステータス判定
            if is_weekend:
                status = "weekend"
            elif attendance and attendance.clock_in:
                status = "present"
            else:
                status = "absent"
            
            calendar_day = {
                "date": current_date,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": False,  # 将来の祝日対応
                "attendance": attendance,
                "status": status
            }
            calendar_days.append(calendar_day)
        
        return calendar_days
    
    async def get_monthly_calendar_summary(
        self,
        user_id: int,
        year: int,
        month: int
    ) -> dict:
        """
        月間カレンダーの集計データを取得
        """
        calendar_days = await self.get_monthly_calendar(user_id, year, month)
        
        # 集計計算
        total_working_days = sum(1 for day in calendar_days if not day["is_weekend"] and not day["is_holiday"])
        total_present_days = sum(1 for day in calendar_days if day["status"] == "present")
        
        # 出勤率計算
        attendance_rate = Decimal("0")
        if total_working_days > 0:
            attendance_rate = Decimal(str(total_present_days / total_working_days * 100)).quantize(Decimal("0.01"))
        
        # 総労働時間と総支給額
        total_hours = Decimal("0")
        total_amount = Decimal("0")
        for day in calendar_days:
            if day["attendance"]:
                total_hours += day["attendance"].total_hours or Decimal("0")
                total_amount += day["attendance"].total_amount or Decimal("0")
        
        return {
            "year": year,
            "month": month,
            "calendar_days": calendar_days,
            "total_working_days": total_working_days,
            "total_present_days": total_present_days,
            "attendance_rate": attendance_rate,
            "total_hours": total_hours,
            "total_amount": total_amount
        }