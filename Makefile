# 勤怠管理システム Makefile
.PHONY: help start stop restart restart-fe restart-be logs logs-fe logs-be clean local local-backend local-frontend local-deps local-status local-create-user

# デフォルトタスク - ヘルプを表示
help:
	@echo "勤怠管理システム - 利用可能なコマンド:"
	@echo ""
	@echo "🐳 Docker モード:"
	@echo "  make start          - 全サービス起動"
	@echo "  make stop           - 全サービス停止"
	@echo "  make restart        - 全サービス再起動"
	@echo "  make restart-fe     - フロントエンド再起動"
	@echo "  make restart-be     - バックエンド再起動"
	@echo "  make logs           - 全サービスのログ表示"
	@echo "  make logs-fe        - フロントエンドのログ表示"
	@echo "  make logs-be        - バックエンドのログ表示"
	@echo "  make clean          - ボリュームとコンテナの削除"
	@echo ""
	@echo "🏠 ローカル SQLite モード:"
	@echo "  make local          - フル起動（フロント+バック）"
	@echo "  make local-backend  - バックエンドのみローカル起動"
	@echo "  make local-frontend - フロントエンドのみローカル起動"
	@echo "  make local-deps     - ローカル実行用の依存関係インストール"
	@echo "  make local-status   - ローカルデータベースの状態確認"
	@echo "  make local-create-user - テストユーザーを作成"
	@echo ""

# 全サービス起動
start:
	docker-compose up -d --build
	@echo "✅ 全サービスが起動しました"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - Backend:  http://localhost:8000"
	@echo "  - API Docs: http://localhost:8000/docs"

# 全サービス停止
stop:
	docker-compose down
	@echo "✅ 全サービスが停止しました"

# 全サービス再起動
restart:
	docker-compose restart
	@echo "✅ 全サービスが再起動しました"

# フロントエンド再起動
restart-fe:
	docker-compose restart frontend
	@echo "✅ フロントエンドが再起動しました"
	@echo "  - Frontend: http://localhost:3000"

# バックエンド再起動
restart-be:
	docker-compose restart backend
	@echo "✅ バックエンドが再起動しました"
	@echo "  - Backend:  http://localhost:8000"
	@echo "  - API Docs: http://localhost:8000/docs"

# 全サービスのログ表示
logs:
	docker-compose logs -f

# フロントエンドのログ表示
logs-fe:
	docker-compose logs -f frontend

# バックエンドのログ表示
logs-be:
	docker-compose logs -f backend

# ボリュームとコンテナの削除（データベースも削除されるので注意）
clean:
	@echo "⚠️  警告: この操作はデータベースを含む全データを削除します"
	@read -p "続行しますか？ (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	@echo "✅ 全てのコンテナとボリュームが削除されました"

# ローカル SQLite モード
local-deps:
	@echo "📦 Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed!"

local-backend:
	@echo "🚀 Starting backend in SQLite mode..."
	@echo "📁 Data will be saved to: ~/.attendance/attendance.db"
	@echo "🌐 Backend URL: http://localhost:8000"
	cd backend && DB_TYPE=sqlite PYTHONPATH=$$(pwd) uvicorn main:app --reload --host 0.0.0.0 --port 8000

local-frontend:
	@echo "🎨 Starting frontend..."
	@echo "🌐 Frontend URL: http://localhost:3000"
	cd frontend && npm run dev

local:
	@echo "🚀 Starting full application in local SQLite mode..."
	@echo "📁 Data will be saved to: ~/.attendance/attendance.db"
	@echo "🌐 Backend: http://localhost:8000"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo ""
	@echo "Press Ctrl+C to stop both services"
	@echo ""
	@trap 'kill 0' EXIT; \
	(cd backend && DB_TYPE=sqlite PYTHONPATH=$$(pwd) uvicorn main:app --reload --host 0.0.0.0 --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

local-status:
	@echo "📊 Local SQLite Database Status:"
	@echo "🗂️  Database location: ~/.attendance/"
	@if [ -f ~/.attendance/attendance.db ]; then \
		echo "✅ Database file exists ($$(ls -lh ~/.attendance/attendance.db | awk '{print $$5}'))"; \
		echo "📋 Tables:"; \
		sqlite3 ~/.attendance/attendance.db ".tables" | sed 's/^/   - /'; \
		echo "👥 Users count: $$(sqlite3 ~/.attendance/attendance.db 'SELECT COUNT(*) FROM users;')"; \
		echo "📝 Attendance records: $$(sqlite3 ~/.attendance/attendance.db 'SELECT COUNT(*) FROM attendance;')"; \
	else \
		echo "❌ Database file not found. Run 'make local-backend' first."; \
	fi

local-create-user:
	@echo "👤 Creating test user..."
	cd backend && DB_TYPE=sqlite PYTHONPATH=$$(pwd) python create_test_user.py
	@echo "✅ Test user creation completed!"