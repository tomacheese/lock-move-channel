# GitHub Copilot コードレビュー指示

このファイルは GitHub Copilot のコードレビュー機能向けに、このリポジトリのレビュー基準を定義する。
開発作業手順は `CLAUDE.md` を参照（このファイルでは重複させない）。

## リポジトリの前提

- Discord チャンネルの移動を検出し、元の位置へ自動復元する Discord Bot（TypeScript / Node.js 24 / discord.js / @book000/node-utils）。
- 実行は `tsx` で直接行い、配布ビルドは `ncc`（`pnpm package`）。エントリは `src/main.ts`。

## 自動強制される規約（レビューで重複指摘しない）

- フォーマットは Prettier（`.prettierrc.yml`）で強制: セミコロンなし、シングルクォート、`printWidth: 80`、`trailingComma: es5`、`arrowParens: always`、`endOfLine: lf`。整形済みコードにスタイル指摘を付けない。
- Lint は `@book000/eslint-config`（`eslint.config.mjs`）で強制。CI（`pnpm lint` = prettier + eslint + tsc）で検査される。

## レビューで重点的に確認する点

- **言語規約**: コード内コメントと docstring は日本語。ユーザー向け／ログのエラーメッセージは英語。日本語と英数字の間には半角スペース。既存のエラーメッセージが絵文字付きなら、新規も先頭に一文字絵文字を付ける。
- **型安全性**: `skipLibCheck` を有効化して型エラーを回避するのは禁止。`any` への安易な逃避や不要な型アサーションを指摘する。
- **機密情報**: Discord トークンは `data/config.json` で管理される。トークン等の認証情報をコード・ログ・コミットに含めていないか確認する。
- **Discord API**: レート制限・権限（intents / permissions）の考慮漏れ、破壊的操作（チャンネル並び替え・削除）の副作用に注意する。
- **設定スキーマ**: 設定項目を追加・変更した場合、`schema/Configuration.json` と `src/config.ts` の `ConfigInterface` が整合しているか、必要なら `README.md` も更新されているか確認する。
- **コマンド登録**: スラッシュコマンドを追加した場合、`src/commands/` に実装し `src/discord.ts` で import して `Discord.routes` に登録されているか確認する。

## フラグすべきでない既知パターン（誤検知回避）

- テストコードは現状存在しない。テスト未追加それ自体をブロッキング指摘にしない（重要ロジックへの追加提案は可）。
- `tsx` による直接実行が正規の実行方法。開発時にビルド成果物が無いことを不備として指摘しない。
- ロギングと設定は `@book000/node-utils` の `Logger` / `ConfigFramework` を利用する既存方針。独自実装への置き換えを一律に推奨しない。
