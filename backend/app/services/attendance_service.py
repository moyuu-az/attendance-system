from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Optional
import logging

from app.models.attendance import Attendance
from app.models.user import User
from app.models.break_time import BreakTime

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
        
        today = date.today()
        current_time = clock_in_time or datetime.now().time()
        
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
        today = date.today()
        current_time = clock_out_time or datetime.now().time()
        
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