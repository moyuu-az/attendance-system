from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, time, timedelta
from typing import Optional
import logging

from app.models.break_time import BreakTime
from app.models.attendance import Attendance
from app.utils.timezone import now_time_jst


class BreakServiceError(Exception):
    """
    休憩サービスカスタムエラー
    """
    def __init__(self, message: str, error_code: str = "BREAK_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code

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
        try:
            # 勤怠記録の存在確認
            attendance = await self.db.get(Attendance, attendance_id)
            if not attendance:
                logger.warning(f"Attendance record {attendance_id} not found")
                raise BreakServiceError(
                    f"勤怠記録が見つかりません（ID: {attendance_id}）",
                    "ATTENDANCE_NOT_FOUND"
                )
            
            if not attendance.clock_in:
                logger.warning(f"Cannot start break for attendance {attendance_id}: not clocked in")
                raise BreakServiceError(
                    "出勤してから休憩を開始してください",
                    "NOT_CLOCKED_IN"
                )
            
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
                logger.warning(f"Attempted to start break for attendance {attendance_id} with unfinished break {unfinished_break.id}")
                raise BreakServiceError(
                    "進行中の休憩があります。先に休憩を終了してください",
                    "BREAK_NOT_ENDED"
                )
            
            # 退勤後の休憩開始を防ぐ
            if attendance.clock_out:
                logger.warning(f"Cannot start break for attendance {attendance_id}: already clocked out")
                raise BreakServiceError(
                    "退勤後は休憩を開始できません",
                    "ALREADY_CLOCKED_OUT"
                )
            
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
            
        except BreakServiceError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Unexpected error starting break for attendance {attendance_id}: {e}")
            raise BreakServiceError(
                "休憩開始処理中にエラーが発生しました",
                "INTERNAL_ERROR"
            )
    
    async def end_break(
        self,
        break_id: int,
        end_time: Optional[time] = None
    ) -> BreakTime:
        """
        休憩終了処理
        """
        try:
            # 休憩記録の取得
            break_time = await self.db.get(BreakTime, break_id)
            if not break_time:
                logger.warning(f"Break record {break_id} not found")
                raise BreakServiceError(
                    f"休憩記録が見つかりません（ID: {break_id}）",
                    "BREAK_NOT_FOUND"
                )
            
            if break_time.end_time:
                logger.warning(f"Attempted to end already ended break {break_id}")
                raise BreakServiceError(
                    "この休憩は既に終了しています",
                    "BREAK_ALREADY_ENDED"
                )
            
            current_time = end_time or now_time_jst()
            
            # 開始時刻より前の終了時刻は無効
            if current_time < break_time.start_time:
                logger.warning(f"Invalid end time for break {break_id}: {current_time} < {break_time.start_time}")
                raise BreakServiceError(
                    "終了時刻は開始時刻より後に設定してください",
                    "INVALID_END_TIME"
                )
            
            break_time.end_time = current_time
            
            # 休憩時間の計算
            await self.calculate_duration(break_time)
            
            # 異常に長い休憩時間のチェック（24時間以上）
            if break_time.duration and break_time.duration > 1440:  # 24時間 = 1440分
                logger.warning(f"Unusually long break duration for break {break_id}: {break_time.duration} minutes")
            
            await self.db.commit()
            await self.db.refresh(break_time)
            
            logger.info(f"Break {break_id} ended at {current_time} (duration: {break_time.duration} minutes)")
            return break_time
            
        except BreakServiceError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Unexpected error ending break {break_id}: {e}")
            raise BreakServiceError(
                "休憩終了処理中にエラーが発生しました",
                "INTERNAL_ERROR"
            )
    
    async def calculate_duration(self, break_time: BreakTime) -> None:
        """
        休憩時間を計算（分単位）
        """
        try:
            if not break_time.start_time or not break_time.end_time:
                logger.debug(f"Cannot calculate duration for break {break_time.id}: missing start_time or end_time")
                break_time.duration = 0
                return
            
            # 休憩時間の計算
            attendance = await self.db.get(Attendance, break_time.attendance_id)
            if not attendance:
                logger.error(f"Attendance record {break_time.attendance_id} not found for break {break_time.id}")
                break_time.duration = 0
                return
            
            try:
                start_dt = datetime.combine(attendance.date, break_time.start_time)
                end_dt = datetime.combine(attendance.date, break_time.end_time)
                
                # 日跨ぎ対応
                if end_dt < start_dt:
                    end_dt += timedelta(days=1)
                
                # 負の時間を防ぐ
                if end_dt <= start_dt:
                    logger.warning(f"Invalid time range for break {break_time.id}: start={start_dt}, end={end_dt}")
                    break_time.duration = 0
                    return
                
                duration_seconds = (end_dt - start_dt).total_seconds()
                duration_minutes = max(0, int(duration_seconds / 60))  # 負の値を防ぐ
                
                # 異常に長い休憩時間のチェック（48時間以上）
                if duration_minutes > 2880:  # 48時間 = 2880分
                    logger.warning(f"Extremely long break duration for break {break_time.id}: {duration_minutes} minutes")
                    # エラーにはしないが、警告ログを出力
                
                break_time.duration = duration_minutes
                logger.debug(f"Break {break_time.id} duration calculated: {duration_minutes} minutes")
                
            except (ValueError, TypeError) as e:
                logger.error(f"Error calculating duration for break {break_time.id}: {e}")
                break_time.duration = 0
                
        except Exception as e:
            logger.error(f"Unexpected error calculating duration for break {break_time.id}: {e}")
            break_time.duration = 0