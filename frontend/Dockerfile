FROM node:20-alpine

WORKDIR /app

# 依存関係ファイルのコピー
COPY package.json package-lock.json ./

# 依存関係のインストール
RUN npm ci --legacy-peer-deps

# アプリケーションファイルのコピー
COPY . .

# Next.jsの開発サーバー起動
CMD ["npm", "run", "dev"]