#!/bin/bash

# SQLiteローカルモードでアプリケーションを実行するスクリプト

echo "🚀 Starting Attendance System in SQLite Local Mode..."
echo "📁 Data will be saved to: ~/.attendance/attendance.db"

# バックエンドを起動
cd backend

# 仮想環境がある場合はアクティベート（オプション）
# source venv/bin/activate

# 環境変数を設定してアプリケーションを起動
export DB_TYPE=sqlite
export PYTHONPATH=$(pwd)

echo "📊 Starting backend server on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000