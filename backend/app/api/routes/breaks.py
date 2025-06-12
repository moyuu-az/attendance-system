from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, time
import logging

from app.core.database import get_db
from app.models.break_time import BreakTime
from app.models.attendance import Attendance
from app.schemas.break_time import (
    BreakTimeResponse, BreakTimeUpdate,
    BreakStartRequest, BreakEndRequest
)
from app.services.break_service import BreakService, BreakServiceError

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/start", response_model=BreakTimeResponse)
async def start_break(
    request: BreakStartRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩開始
    """
    try:
        service = BreakService(db)
        break_time = await service.start_break(
            attendance_id=request.attendance_id,
            start_time=request.time
        )
        logger.info(f"Break started successfully for attendance {request.attendance_id}: {break_time.id}")
        logger.debug(f"Break start response: id={break_time.id}, start_time={break_time.start_time}, attendance_id={break_time.attendance_id}")
        return break_time
    except BreakServiceError as e:
        logger.warning(f"Break start validation error: {e.message} (code: {e.error_code})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": e.message,
                "error_code": e.error_code,
                "error_type": "break_error"
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error starting break: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "休憩開始処理に失敗しました。再度お試しください。",
                "error_code": "INTERNAL_ERROR",
                "error_type": "system_error"
            }
        )


@router.post("/end", response_model=BreakTimeResponse)
async def end_break(
    request: BreakEndRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩終了
    """
    try:
        service = BreakService(db)
        break_time = await service.end_break(
            break_id=request.break_id,
            end_time=request.time
        )
        logger.info(f"Break {request.break_id} ended successfully: duration={break_time.duration} minutes")
        logger.debug(f"Break end response: id={break_time.id}, end_time={break_time.end_time}, duration={break_time.duration}, attendance_id={break_time.attendance_id}")
        return break_time
    except BreakServiceError as e:
        logger.warning(f"Break end validation error: {e.message} (code: {e.error_code})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": e.message,
                "error_code": e.error_code,
                "error_type": "break_error"
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error ending break {request.break_id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "休憩終了処理に失敗しました。再度お試しください。",
                "error_code": "INTERNAL_ERROR",
                "error_type": "system_error"
            }
        )


@router.get("/{attendance_id}", response_model=List[BreakTimeResponse])
async def get_breaks_by_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    特定の勤怠に紐づく休憩時間一覧を取得
    """
    try:
        # 勤怠記録の存在確認
        attendance_result = await db.execute(
            select(Attendance).where(Attendance.id == attendance_id)
        )
        if not attendance_result.scalar_one_or_none():
            logger.warning(f"Attendance record {attendance_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attendance record {attendance_id} not found"
            )
        
        # 休憩時間の取得
        result = await db.execute(
            select(BreakTime)
            .where(BreakTime.attendance_id == attendance_id)
            .order_by(BreakTime.start_time)
        )
        breaks = result.scalars().all()
        
        logger.info(f"Retrieved {len(breaks)} break records for attendance {attendance_id}")
        return breaks
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving breaks for attendance {attendance_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve break records"
        )


@router.put("/{break_id}", response_model=BreakTimeResponse)
async def update_break(
    break_id: int,
    break_update: BreakTimeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩時間を更新
    """
    try:
        result = await db.execute(
            select(BreakTime).where(BreakTime.id == break_id)
        )
        break_time = result.scalar_one_or_none()
        
        if not break_time:
            logger.warning(f"Break time record {break_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Break time record {break_id} not found"
            )
        
        # 更新データの適用
        update_data = break_update.model_dump(exclude_unset=True)
        if not update_data:
            logger.warning(f"No valid update data provided for break {break_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid update data provided"
            )
        
        for field, value in update_data.items():
            setattr(break_time, field, value)
        
        # 休憩時間の再計算
        service = BreakService(db)
        await service.calculate_duration(break_time)
        
        await db.commit()
        await db.refresh(break_time)
        
        # 勤怠の合計時間も更新
        from app.services.attendance_service import AttendanceService
        attendance_service = AttendanceService(db)
        attendance = await db.get(Attendance, break_time.attendance_id)
        if attendance:
            await attendance_service.calculate_totals(attendance)
            await db.commit()
        
        logger.info(f"Break time {break_id} updated successfully")
        return break_time
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating break {break_id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update break record"
        )


@router.delete("/{break_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_break(
    break_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩時間記録を削除
    """
    try:
        result = await db.execute(
            select(BreakTime).where(BreakTime.id == break_id)
        )
        break_time = result.scalar_one_or_none()
        
        if not break_time:
            logger.warning(f"Break time record {break_id} not found for deletion")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Break time record {break_id} not found"
            )
        
        attendance_id = break_time.attendance_id
        
        await db.delete(break_time)
        await db.commit()
        
        # 勤怠の合計時間も更新
        from app.services.attendance_service import AttendanceService
        attendance_service = AttendanceService(db)
        attendance = await db.get(Attendance, attendance_id)
        if attendance:
            await attendance_service.calculate_totals(attendance)
            await db.commit()
        
        logger.info(f"Break time {break_id} deleted successfully")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting break {break_id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete break record"
        )