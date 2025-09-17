# AI Chord Generation Test

Gemini APIを使用したAIコード生成テストページです。

## セットアップ

### 1. Gemini APIキーの取得

1. [Google AI Studio](https://ai.google.dev/gemini-api/docs/quickstart?hl=ja)にアクセス
2. 無料でAPIキーを取得

### 2. 環境変数の設定

プロジェクトルート（`syntheditor`ディレクトリ）に`.env.local`ファイルを作成し、以下の内容を追加してください：

```bash
# Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**重要**: `your_api_key_here`を実際のAPIキーに置き換えてください。

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. アクセス

ブラウザで以下のURLにアクセス：
```
http://localhost:3000/test/core/ai-chord-generation
```

## 機能

- **AIコード進行生成**: Gemini 2.5 Flashモデルを使用
- **5パターン同時生成**: 複数のコード進行パターンを生成
- **パターン選択**: 生成されたパターンから選択可能
- **デバイス送信**: 接続されたデバイスにコード進行を送信
- **シーケンス編集**: 生成されたコード進行を編集可能

## 使用方法

1. APIキーが正しく設定されているか確認
2. プロンプトを編集（必要に応じて）
3. 「AIコード進行生成」ボタンをクリック
4. 生成されたパターンから選択
5. デバイスに送信

## セキュリティ

- APIキーは環境変数で管理
- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- 本番環境では適切な環境変数管理を行ってください
