# 勤怠管理システム (Attendance Management System)

勤怠管理を効率化するWebアプリケーションです。従業員の出勤・退勤時間の記録、休憩時間の管理、月次・年次レポートの生成機能を提供します。

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
- **PostgreSQL**: データベース
- **Pydantic**: データバリデーション
- **Alembic**: データベースマイグレーション

### インフラ
- **Docker & Docker Compose**: コンテナ化
- **PostgreSQL 15**: データベース

## 📋 必要な環境

- Docker Desktop
- Make (オプション - コマンド実行の簡略化用)

## 🚀 アプリケーションの起動方法

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd attendance
```

### 2. アプリケーションの起動

#### Makefileを使用する場合（推奨）

```bash
# 全サービスを起動
make start
```

#### Docker Composeを直接使用する場合

```bash
# 全サービスを起動
docker-compose up -d
```

### 3. アクセス確認

起動後、以下のURLでアクセス可能です：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 📖 利用可能なコマンド

### Makeコマンド

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

### Docker Composeコマンド

```bash
docker-compose up -d                    # バックグラウンドで起動
docker-compose down                     # サービス停止
docker-compose logs -f                  # ログの監視
docker-compose restart [service-name]   # 特定サービスの再起動
```

## 🗄 データベース構成

アプリケーション起動時に、`init.sql`により初期データベーススキーマが作成されます。

### 主要テーブル
- **users**: ユーザー情報
- **attendance_records**: 勤怠記録
- **breaks**: 休憩時間記録

## 🔧 開発環境での作業

### ローカル開発サーバーの起動

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
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### データベースマイグレーション

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

### よくある問題と解決方法

1. **ポートが既に使用されている**
   ```bash
   # 使用中のポートを確認
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   ```

2. **データベース接続エラー**
   ```bash
   # データベースサービスの状態確認
   docker-compose ps database
   docker-compose logs database
   ```

3. **フロントエンドのビルドエラー**
   ```bash
   # Node.js依存関係の再インストール
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **データのリセット**
   ```bash
   # 全データとボリュームを削除（注意：データが失われます）
   make clean
   ```

## 📝 ライセンス

[ライセンス情報をここに記載]

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します。Issue の報告やプルリクエストをお待ちしております。
