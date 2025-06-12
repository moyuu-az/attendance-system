from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import logging

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: int = 4,  # Admin固定ログイン
    db: AsyncSession = Depends(get_db)
):
    """
    現在のユーザー情報を取得
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    user_id: int = 4,  # Admin固定ログイン
    db: AsyncSession = Depends(get_db)
):
    """
    現在のユーザー情報を更新
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 更新データの適用
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"User {user_id} updated successfully")
    return user


@router.put("/me/hourly-rate", response_model=UserResponse)
async def update_hourly_rate(
    hourly_rate: float,
    user_id: int = 4,  # Admin固定ログイン
    db: AsyncSession = Depends(get_db)
):
    """
    時給を更新
    """
    if hourly_rate < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hourly rate must be positive"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hourly_rate = hourly_rate
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"User {user_id} hourly rate updated to {hourly_rate}")
    return user


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    全ユーザー一覧を取得
    """
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    新規ユーザーを作成
    """
    # メールアドレスの重複チェック
    result = await db.execute(select(User).where(User.email == user_create.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # ユーザー作成
    user = User(**user_create.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"New user created: {user.email}")
    return user