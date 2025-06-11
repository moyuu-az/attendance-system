from sqlalchemy import Column, Integer, ForeignKey, Time, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class BreakTime(Base):
    """
    休憩時間モデル
    """
    __tablename__ = "break_times"
    
    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=True)
    duration = Column(Integer, default=0)  # 分単位
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーションシップ
    attendance = relationship("Attendance", back_populates="break_times")