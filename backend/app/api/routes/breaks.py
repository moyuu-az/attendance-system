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
from app.services.break_service import BreakService

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
    service = BreakService(db)
    break_time = await service.start_break(
        attendance_id=request.attendance_id,
        start_time=request.time
    )
    return break_time


@router.post("/end", response_model=BreakTimeResponse)
async def end_break(
    request: BreakEndRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩終了
    """
    service = BreakService(db)
    break_time = await service.end_break(
        break_id=request.break_id,
        end_time=request.time
    )
    return break_time


@router.get("/{attendance_id}", response_model=List[BreakTimeResponse])
async def get_breaks_by_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    特定の勤怠に紐づく休憩時間一覧を取得
    """
    # 勤怠記録の存在確認
    attendance_result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    if not attendance_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    # 休憩時間の取得
    result = await db.execute(
        select(BreakTime)
        .where(BreakTime.attendance_id == attendance_id)
        .order_by(BreakTime.start_time)
    )
    breaks = result.scalars().all()
    
    return breaks


@router.put("/{break_id}", response_model=BreakTimeResponse)
async def update_break(
    break_id: int,
    break_update: BreakTimeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩時間を更新
    """
    result = await db.execute(
        select(BreakTime).where(BreakTime.id == break_id)
    )
    break_time = result.scalar_one_or_none()
    
    if not break_time:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Break time record not found"
        )
    
    # 更新データの適用
    update_data = break_update.model_dump(exclude_unset=True)
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


@router.delete("/{break_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_break(
    break_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    休憩時間記録を削除
    """
    result = await db.execute(
        select(BreakTime).where(BreakTime.id == break_id)
    )
    break_time = result.scalar_one_or_none()
    
    if not break_time:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Break time record not found"
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