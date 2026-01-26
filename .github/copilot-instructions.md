# GitHub Copilot Instructions

## プロジェクト概要
- **目的**: Discord チャンネルの移動を検出し、自動的に元の位置に戻す
- **主な機能**:
  - 複数の Discord サーバーでのチャンネル順序の固定
  - 一時的なロック解除機能
  - ロック中でもチャンネルの作成・削除を許容
  - Docker Compose による動作サポート
- **対象ユーザー**: Discord サーバー管理者

## 共通ルール
- 会話は日本語で行う。
- PR とコミットは [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従う。
  - 形式: `<type>(<scope>): <description>`
  - `<description>` は日本語で記載する。
- 日本語と英数字の間には半角スペースを入れる。
- コード内のコメントは日本語で記載する。
- エラーメッセージは英語で記載する。

## 技術スタック
- **言語**: TypeScript (Node.js v20+)
- **ライブラリ**: discord.js, @book000/node-utils
- **パッケージマネージャー**: pnpm

## コーディング規約
- **TypeScript**: `skipLibCheck` の使用は禁止。
- **ドキュメント**: 関数やインターフェースには JSDoc 等を日本語で記載する。
- **命名規則**: プロジェクトの既存の命名規則（camelCase 等）に従う。
- **フォーマット**: Prettier および ESLint の設定に従う。

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 開発（ホットリロードあり）
pnpm dev

# 実行
pnpm start

# Lint 実行
pnpm lint

# コードの自動修正
pnpm fix

# コンパイル
pnpm compile

# パッケージング（ncc を使用）
pnpm package
```

## テスト方針
- 現在、明示的なテストコードは存在しないが、必要に応じて追加する。

## セキュリティ / 機密情報
- Discord トークン等の機密情報は `data/config.json` で管理し、Git にコミットしない。
- ログに個人情報や認証情報を出力しない。

## ドキュメント更新
- `README.md`: 機能追加や設定方法の変更時に更新。
- `schema/Configuration.json`: 設定ファイルのスキーマ変更時に更新。

## リポジトリ固有
- 設定は `data/config.json` または環境変数 `CONFIG_FILE` / `CONFIG_PATH` で指定される。
- `ncc` を使用して一つの実行ファイルにビルドされる。
