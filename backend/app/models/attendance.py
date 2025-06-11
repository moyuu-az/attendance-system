from sqlalchemy import Column, Integer, ForeignKey, Date, Time, Numeric, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Attendance(Base):
    """
    勤怠モデル
    """
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    clock_in = Column(Time, nullable=True)
    clock_out = Column(Time, nullable=True)
    total_hours = Column(Numeric(5, 2), default=0)
    total_amount = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # ユニーク制約: 同じユーザーの同じ日付は1件のみ
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_uc'),)
    
    # リレーションシップ
    user = relationship("User", back_populates="attendances")
    break_times = relationship("BreakTime", back_populates="attendance", cascade="all, delete-orphan")