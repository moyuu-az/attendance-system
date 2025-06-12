from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, time, timedelta
from typing import Optional
import logging

from app.models.break_time import BreakTime
from app.models.attendance import Attendance
from app.utils.timezone import now_time_jst

logger = logging.getLogger(__name__)


class BreakService:
    """
    休憩時間管理サービス
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def start_break(
        self,
        attendance_id: int,
        start_time: Optional[time] = None
    ) -> BreakTime:
        """
        休憩開始処理
        """
        # 勤怠記録の存在確認
        attendance = await self.db.get(Attendance, attendance_id)
        if not attendance:
            raise ValueError(f"Attendance {attendance_id} not found")
        
        if not attendance.clock_in:
            raise ValueError("Cannot start break before clocking in")
        
        current_time = start_time or now_time_jst()
        
        # 未終了の休憩がないか確認
        result = await self.db.execute(
            select(BreakTime).where(
                BreakTime.attendance_id == attendance_id,
                BreakTime.end_time.is_(None)
            )
        )
        unfinished_break = result.scalar_one_or_none()
        
        if unfinished_break:
            raise ValueError("Previous break not ended")
        
        # 休憩開始
        break_time = BreakTime(
            attendance_id=attendance_id,
            start_time=current_time
        )
        self.db.add(break_time)
        
        await self.db.commit()
        await self.db.refresh(break_time)
        
        logger.info(f"Break started for attendance {attendance_id} at {current_time}")
        return break_time
    
    async def end_break(
        self,
        break_id: int,
        end_time: Optional[time] = None
    ) -> BreakTime:
        """
        休憩終了処理
        """
        # 休憩記録の取得
        break_time = await self.db.get(BreakTime, break_id)
        if not break_time:
            raise ValueError(f"Break {break_id} not found")
        
        if break_time.end_time:
            raise ValueError("Break already ended")
        
        current_time = end_time or now_time_jst()
        break_time.end_time = current_time
        
        # 休憩時間の計算
        await self.calculate_duration(break_time)
        
        await self.db.commit()
        await self.db.refresh(break_time)
        
        logger.info(f"Break {break_id} ended at {current_time}")
        return break_time
    
    async def calculate_duration(self, break_time: BreakTime) -> None:
        """
        休憩時間を計算（分単位）
        """
        if not break_time.start_time or not break_time.end_time:
            return
        
        # 休憩時間の計算
        attendance = await self.db.get(Attendance, break_time.attendance_id)
        if not attendance:
            return
        
        start_dt = datetime.combine(attendance.date, break_time.start_time)
        end_dt = datetime.combine(attendance.date, break_time.end_time)
        
        # 日跨ぎ対応
        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        break_time.duration = duration_minutes
        
        logger.info(f"Break {break_time.id} duration: {duration_minutes} minutes")