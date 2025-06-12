# 勤怠管理システム (Attendance Management System)

勤怠管理を効率化するWebアプリケーションです。従業員の出勤・退勤時間の記録、休憩時間の管理、月次・年次レポートの生成機能を提供します。

🆕 **SQLiteローカルモード対応**: Dockerなしで軽量動作、Mac再起動後もデータ永続化

## 🚀 主な機能

- **出退勤管理**: ワンクリックで出勤・退勤の記録
- **休憩時間記録**: 休憩開始・終了時間の自動追跡
- **勤怠編集**: 過去の勤怠記録の編集・削除機能
- **月次カレンダー**: 月単位での勤怠状況の視覚的表示
- **レポート機能**: 月次・年次の勤怠サマリーとチャート表示
- **リアルタイム更新**: 勤怠状況のリアルタイム反映

## 🛠 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: スタイリング
- **Radix UI**: アクセシブルなUIコンポーネント
- **Zustand**: 状態管理
- **TanStack Query**: データフェッチング・キャッシュ
- **Recharts**: チャート表示

### バックエンド
- **FastAPI**: 高速なPython Webフレームワーク
- **SQLAlchemy**: ORM
- **SQLite / PostgreSQL**: データベース（環境により選択可能）
- **Pydantic**: データバリデーション
- **Alembic**: データベースマイグレーション

### インフラ
- **Docker & Docker Compose**: コンテナ化（オプション）
- **SQLite**: ローカル開発用データベース
- **PostgreSQL 15**: Docker環境用データベース

## 📋 必要な環境

### 🏠 ローカルSQLiteモード（推奨）
- **Python 3.11+**
- **Node.js 18+**
- **Make** (オプション - コマンド実行の簡略化用)

### 🐳 Dockerモード
- **Docker Desktop**
- **Make** (オプション)

## 🚀 アプリケーションの起動方法

### 🏠 ローカルSQLiteモード（推奨・高速起動）

#### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd attendance
```

#### 2. 依存関係のインストール
```bash
make local-deps
```

#### 3. テストユーザーの作成（初回のみ）
```bash
make local-create-user
```

#### 4. アプリケーションの起動
```bash
# フロント＋バック同時起動（推奨）
make local

# または個別起動
make local-backend   # バックエンドのみ
make local-frontend  # フロントエンドのみ
```

### 🐳 Dockerモード

#### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd attendance
```

#### 2. アプリケーションの起動
```bash
# Makefileを使用する場合（推奨）
make start

# Docker Composeを直接使用する場合
docker-compose up -d
```

## 🌐 アクセス確認

起動後、以下のURLでアクセス可能です：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 📖 利用可能なコマンド

### 🏠 ローカルSQLiteモード用コマンド

```bash
make local              # フル起動（フロント+バック同時）
make local-backend      # バックエンドのみ起動
make local-frontend     # フロントエンドのみ起動
make local-deps         # 依存関係インストール
make local-status       # データベース状態確認
make local-create-user  # テストユーザー作成
```

### 🐳 Dockerモード用コマンド

```bash
make start          # 全サービス起動
make stop           # 全サービス停止
make restart        # 全サービス再起動
make restart-fe     # フロントエンド再起動
make restart-be     # バックエンド再起動
make logs           # 全サービスのログ表示
make logs-fe        # フロントエンドのログ表示
make logs-be        # バックエンドのログ表示
make clean          # ボリュームとコンテナの削除（注意：データも削除されます）
```

### Docker Composeコマンド（直接実行）

```bash
docker-compose up -d                    # バックグラウンドで起動
docker-compose down                     # サービス停止
docker-compose logs -f                  # ログの監視
docker-compose restart [service-name]   # 特定サービスの再起動
```

## 🗄 データベース構成

### 🏠 SQLiteモード
- **データ保存場所**: `~/.attendance/attendance.db`
- **永続化**: Mac再起動後もデータが保持される
- **バックアップ**: ファイルをコピーするだけ

### 🐳 Dockerモード
- **データ保存場所**: Dockerボリューム
- **初期化**: `init.sql`により初期スキーマが作成される
- **注意**: `docker-compose down -v`でデータが削除される

### 主要テーブル
- **users**: ユーザー情報
- **attendance**: 勤怠記録
- **break_times**: 休憩時間記録

## 🔧 開発環境での作業

### 推奨ワークフロー（SQLiteモード）

```bash
# 1. 依存関係インストール（初回のみ）
make local-deps

# 2. テストユーザー作成（初回のみ）
make local-create-user

# 3. 開発サーバー起動
make local

# 4. データベース状態確認
make local-status
```

### 個別サーバー起動（高度な使用）

#### フロントエンド（Next.js）
```bash
cd frontend
npm install
npm run dev
```

#### バックエンド（FastAPI）
```bash
cd backend
pip install -r requirements.txt
DB_TYPE=sqlite PYTHONPATH=$(pwd) uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### データベースマイグレーション（Dockerモード）

```bash
# バックエンドコンテナ内でマイグレーション実行
docker-compose exec backend alembic upgrade head
```

## 📁 プロジェクト構造

```
attendance/
├── frontend/                   # Next.js フロントエンド
│   ├── src/
│   │   ├── app/               # App Router ページ
│   │   ├── components/        # React コンポーネント
│   │   ├── hooks/             # カスタムフック
│   │   ├── lib/               # ユーティリティ・API・ストア
│   │   └── types/             # TypeScript 型定義
│   └── package.json
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── api/               # API ルート
│   │   ├── core/              # 設定・データベース
│   │   ├── models/            # SQLAlchemy モデル
│   │   ├── schemas/           # Pydantic スキーマ
│   │   ├── services/          # ビジネスロジック
│   │   └── utils/             # ユーティリティ
│   ├── main.py                # FastAPI アプリケーション
│   └── requirements.txt
├── docker-compose.yml          # Docker サービス定義
├── init.sql                   # データベース初期化スクリプト
├── Makefile                   # 便利コマンド集
└── README.md
```

## 🐛 トラブルシューティング

### SQLiteモード関連

1. **greenletエラー（`No module named 'greenlet'`）**
   ```bash
   pip install greenlet
   ```

2. **ユーザーが見つからないエラー（404 Not Found）**
   ```bash
   # テストユーザーを作成
   make local-create-user
   ```

3. **データベースファイルが見つからない**
   ```bash
   # データベース状態確認
   make local-status
   
   # バックエンドを一度起動してデータベース作成
   make local-backend
   ```

### 共通の問題と解決方法

1. **ポートが既に使用されている**
   ```bash
   # 使用中のポートを確認
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   ```

2. **フロントエンドのビルドエラー**
   ```bash
   # Node.js依存関係の再インストール
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **SQLiteデータのリセット**
   ```bash
   # SQLiteデータベースファイルを削除
   rm -rf ~/.attendance/
   
   # 再初期化
   make local-backend  # バックエンドを起動してDB作成
   make local-create-user  # テストユーザー作成
   ```

4. **Dockerデータのリセット**
   ```bash
   # 全データとボリュームを削除（注意：データが失われます）
   make clean
   ```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します。Issue の報告やプルリクエストをお待ちしております。
