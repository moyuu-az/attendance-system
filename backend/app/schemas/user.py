from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class UserBase(BaseModel):
    """
    ユーザー基本スキーマ
    """
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    hourly_rate: Decimal = Field(default=Decimal("1000.00"), ge=0, decimal_places=2)


class UserCreate(UserBase):
    """
    ユーザー作成用スキーマ
    """
    pass


class UserUpdate(BaseModel):
    """
    ユーザー更新用スキーマ
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    hourly_rate: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class UserResponse(UserBase):
    """
    ユーザーレスポンススキーマ
    """
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """
    データベース保存用ユーザースキーマ
    """
    pass