# 勤怠管理システム Makefile
.PHONY: help start stop restart restart-fe restart-be logs logs-fe logs-be clean

# デフォルトタスク - ヘルプを表示
help:
	@echo "勤怠管理システム - 利用可能なコマンド:"
	@echo ""
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