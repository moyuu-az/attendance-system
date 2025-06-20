from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, datetime, time
import logging

from app.core.database import get_db
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas.attendance import (
    AttendanceResponse, AttendanceWithBreaks,
    ClockInRequest, ClockOutRequest, AttendanceUpdate, AttendanceCreate,
    MonthlyCalendarResponse
)
from app.services.attendance_service import AttendanceService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(
    request: ClockInRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    出勤記録
    """
    service = AttendanceService(db)
    attendance = await service.clock_in(
        user_id=request.user_id,
        clock_in_time=request.time
    )
    return attendance


@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    request: ClockOutRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    退勤記録
    """
    service = AttendanceService(db)
    attendance = await service.clock_out(
        user_id=request.user_id,
        clock_out_time=request.time
    )
    return attendance


@router.post("/", response_model=AttendanceResponse)
async def create_attendance(
    attendance_create: AttendanceCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    新規勤怠記録作成
    指定された日付で新しい勤怠記録を作成します
    """
    # 指定日付の勤怠記録が既に存在するかチェック
    result = await db.execute(
        select(Attendance).where(and_(
            Attendance.user_id == attendance_create.user_id,
            Attendance.date == attendance_create.date
        ))
    )
    existing_attendance = result.scalar_one_or_none()
    
    if existing_attendance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance record already exists for {attendance_create.date}"
        )
    
    # 新しい勤怠記録を作成
    attendance = Attendance(
        user_id=attendance_create.user_id,
        date=attendance_create.date,
        clock_in=attendance_create.clock_in,
        clock_out=attendance_create.clock_out,
        total_hours=0,
        total_amount=0
    )
    
    db.add(attendance)
    
    # 労働時間と金額の計算
    service = AttendanceService(db)
    await service.calculate_totals(attendance)
    
    await db.commit()
    await db.refresh(attendance)
    
    logger.info(f"New attendance record created for user {attendance_create.user_id} on {attendance_create.date}")
    return attendance


@router.get("/today", response_model=Optional[AttendanceWithBreaks])
async def get_today_attendance(
    user_id: int = Query(default=1),
    db: AsyncSession = Depends(get_db)
):
    """
    今日の勤怠情報を取得
    """
    today = date.today()
    
    result = await db.execute(
        select(Attendance)
        .where(and_(
            Attendance.user_id == user_id,
            Attendance.date == today
        ))
        .options(selectinload(Attendance.break_times))
    )
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        logger.info(f"No attendance record found for user {user_id} on {today}")
        return None
    
    break_count = len(attendance.break_times) if attendance.break_times else 0
    logger.info(f"Today attendance retrieved for user {user_id}: attendance_id={attendance.id}, break_times_count={break_count}")
    logger.debug(f"Break times: {[{'id': b.id, 'start_time': b.start_time, 'end_time': b.end_time, 'duration': b.duration} for b in attendance.break_times] if attendance.break_times else []}")
    
    return attendance


@router.get("/", response_model=List[AttendanceWithBreaks])
async def get_attendance_list(
    user_id: int = Query(default=1),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """
    勤怠一覧を取得（月別フィルタ対応）
    """
    
    query = select(Attendance).where(Attendance.user_id == user_id)
    
    # 年月フィルタ
    if year:
        query = query.where(extract('year', Attendance.date) == year)
    if month:
        query = query.where(extract('month', Attendance.date) == month)
    
    # ソートとページネーション
    query = query.order_by(Attendance.date.desc()).offset(skip).limit(limit)
    
    # 休憩時間も一緒に取得
    query = query.options(selectinload(Attendance.break_times))
    
    result = await db.execute(query)
    attendances = result.scalars().all()
    
    return attendances


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    勤怠情報を更新
    """
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    try:
        service = AttendanceService(db)
        
        # 更新データの適用（break_timesを除く）
        update_data = attendance_update.model_dump(exclude_unset=True, exclude={'break_times'})
        for field, value in update_data.items():
            setattr(attendance, field, value)
        
        # 休憩時間の更新処理
        if attendance_update.break_times is not None:
            # Pydanticモデルを辞書に変換
            break_times_data = [
                {
                    'id': bt.id,
                    'start_time': bt.start_time,
                    'end_time': bt.end_time,
                    'duration': bt.duration
                }
                for bt in attendance_update.break_times
            ]
            
            logger.info(f"Updating break times for attendance {attendance_id}: {len(break_times_data)} items")
            await service.update_break_times(attendance, break_times_data)
        
        # 労働時間と金額の再計算
        await service.calculate_totals(attendance)
        
        await db.commit()
        await db.refresh(attendance)
        
        logger.info(f"Attendance {attendance_id} updated successfully with break times")
        return attendance
    
    except Exception as e:
        logger.error(f"Failed to update attendance {attendance_id}: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update attendance: {str(e)}"
        )


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attendance(
    attendance_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    勤怠記録を削除
    """
    result = await db.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found"
        )
    
    await db.delete(attendance)
    await db.commit()
    
    logger.info(f"Attendance {attendance_id} deleted successfully")


@router.get("/calendar", response_model=MonthlyCalendarResponse)
async def get_monthly_calendar(
    user_id: int = Query(default=1),
    year: int = Query(..., description="年"),
    month: int = Query(..., ge=1, le=12, description="月"),
    db: AsyncSession = Depends(get_db)
):
    """
    月間カレンダー形式で勤怠データを取得
    記録がない日も含めて月の全日程を返す
    """
    service = AttendanceService(db)
    calendar_data = await service.get_monthly_calendar_summary(
        user_id=user_id,
        year=year,
        month=month
    )
    
    logger.info(f"Monthly calendar retrieved for user {user_id}, {year}/{month}")
    return calendar_data