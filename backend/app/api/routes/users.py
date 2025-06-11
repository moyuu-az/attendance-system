from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: int = 4,  # Admin固定ログイン
    db: Session = Depends(get_db)
):
    """
    現在のユーザー情報を取得
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    user_id: int = 4,  # Admin固定ログイン
    db: Session = Depends(get_db)
):
    """
    現在のユーザー情報を更新
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 更新データの適用
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"User {user_id} updated successfully")
    return user


@router.put("/me/hourly-rate", response_model=UserResponse)
def update_hourly_rate(
    hourly_rate: float,
    user_id: int = 4,  # Admin固定ログイン
    db: Session = Depends(get_db)
):
    """
    時給を更新
    """
    if hourly_rate < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hourly rate must be positive"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hourly_rate = hourly_rate
    db.commit()
    db.refresh(user)
    
    logger.info(f"User {user_id} hourly rate updated to {hourly_rate}")
    return user


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    全ユーザー一覧を取得
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    新規ユーザーを作成
    """
    # メールアドレスの重複チェック
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # ユーザー作成
    user = User(**user_create.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"New user created: {user.email}")
    return user