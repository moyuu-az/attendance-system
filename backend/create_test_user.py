#!/usr/bin/env python3
"""
テストユーザーを作成するスクリプト
"""

import asyncio
import sys
import os

# パスを追加
sys.path.append(os.getcwd())

from app.core.database import get_sync_db, sync_engine
from app.models.user import User
from app.core.config import settings
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

def create_test_user():
    """
    テストユーザーを作成する関数（同期版）
    """
    print(f"🚀 Creating test user in {settings.DB_TYPE} database...")
    print(f"📁 Database URL: {settings.DATABASE_URL}")
    
    # 同期セッションを作成
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=sync_engine
    )
    
    db = SessionLocal()
    
    try:
        # 既存ユーザーをチェック
        existing_users = db.execute(select(User)).scalars().all()
        print(f"📊 Current users count: {len(existing_users)}")
        
        if len(existing_users) > 0:
            print("✅ Users already exist:")
            for user in existing_users:
                print(f"   - ID: {user.id}, Name: {user.name}, Email: {user.email}")
            return
        
        # テストユーザーを作成
        test_user = User(
            id=4,  # アプリで期待されているID
            name="テストユーザー",
            email="test@example.com",
            hourly_rate=1500.0
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"   - ID: {test_user.id}")
        print(f"   - Name: {test_user.name}")
        print(f"   - Email: {test_user.email}")
        print(f"   - Hourly Rate: ¥{test_user.hourly_rate}")
        
    except Exception as e:
        print(f"❌ Failed to create test user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # 環境変数を設定
    os.environ["DB_TYPE"] = "sqlite"
    
    create_test_user()