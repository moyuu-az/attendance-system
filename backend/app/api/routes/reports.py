from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.core.database import get_db
from app.schemas.reports import MonthlyReport, YearlyReport
from app.services.report_service import ReportService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/monthly", response_model=MonthlyReport)
async def get_monthly_report(
    user_id: int = Query(default=1),
    year: int = Query(..., description="年"),
    month: int = Query(..., ge=1, le=12, description="月"),
    db: AsyncSession = Depends(get_db)
):
    """
    月次レポートを取得
    """
    service = ReportService(db)
    report = await service.get_monthly_report(
        user_id=user_id,
        year=year,
        month=month
    )
    return report


@router.get("/yearly", response_model=YearlyReport)
async def get_yearly_report(
    user_id: int = Query(default=1),
    year: int = Query(..., description="年"),
    db: AsyncSession = Depends(get_db)
):
    """
    年次レポートを取得
    """
    service = ReportService(db)
    report = await service.get_yearly_report(
        user_id=user_id,
        year=year
    )
    return report