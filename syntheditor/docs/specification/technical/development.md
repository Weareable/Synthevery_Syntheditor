# Syntheveryアプリケーション 開発環境・技術仕様

## 概要

Syntheveryアプリケーションの開発環境と技術仕様について説明します。Next.js 14を基盤とし、TypeScript、Tailwind CSS、Web Bluetooth API等の最新技術を活用しています。

## 開発環境

### 基本要件

#### システム要件
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上
- **Git**: 2.30.0以上
- **メモリ**: 8GB以上推奨
- **ストレージ**: 10GB以上の空き容量

#### ブラウザ要件
- **Chrome**: 89以上（Web Bluetooth API対応）
- **Edge**: 89以上（Web Bluetooth API対応）
- **Safari**: 14以上（制限あり）
- **Firefox**: 88以上（制限あり）

### 開発ツール

#### 必須ツール
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0",
  "git": ">=2.30.0"
}
```

#### 推奨ツール
- **VS Code**: 1.70.0以上
- **Chrome DevTools**: デバッグ用
- **Postman**: APIテスト用
- **Figma**: デザイン確認用

### 開発環境セットアップ

#### 1. リポジトリクローン
```bash
git clone https://github.com/your-org/syntheditor.git
cd syntheditor
```

#### 2. 依存関係インストール
```bash
npm install
```

#### 3. 開発サーバー起動
```bash
npm run dev
```

#### 4. ビルド
```bash
npm run build
```

#### 5. テスト実行
```bash
npm test
```

## 技術スタック

### フロントエンド技術

#### フレームワーク・ライブラリ
```json
{
  "next": "^14.2.18",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5"
}
```

#### スタイリング
```json
{
  "tailwindcss": "^4.1.8",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.0"
}
```

#### UIコンポーネント
```json
{
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-toggle": "^1.1.9",
  "lucide-react": "^0.513.0"
}
```

#### 通信・データ
```json
{
  "@msgpack/msgpack": "^3.0.0-beta2",
  "eventemitter3": "^5.0.1",
  "@types/web-bluetooth": "^0.0.20"
}
```

#### 開発・テスト
```json
{
  "jest": "^29.7.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.1.0",
  "eslint": "^8",
  "eslint-config-next": "14.2.5"
}
```

### アーキテクチャ技術

#### 状態管理
- **React Hooks**: ローカル状態管理
- **Custom Hooks**: ビジネスロジック分離
- **EventEmitter**: イベント駆動設計

#### 通信技術
- **Web Bluetooth API**: BLE通信
- **MessagePack**: データシリアライゼーション
- **Custom Protocol**: Meshネットワーク

#### パフォーマンス
- **Next.js App Router**: 最新ルーティング
- **Code Splitting**: 動的インポート
- **Image Optimization**: 画像最適化

## プロジェクト構造

### ディレクトリ構造詳細

```
syntheditor/
├── app/                          # Next.js App Router
│   ├── (connection)/             # 接続関連ページ
│   │   ├── connect/
│   │   │   └── page.tsx         # 接続ページ
│   │   └── layout.tsx           # 接続レイアウト
│   ├── (main)/                  # メインアプリケーション
│   │   ├── layout.tsx           # メインレイアウト
│   │   └── player/              # プレイヤー機能
│   │       ├── synthesizer/
│   │       │   └── page.tsx     # シンセサイザーページ
│   │       ├── drums/
│   │       │   └── page.tsx     # ドラムスページ
│   │       ├── bass/
│   │       │   └── page.tsx     # ベースページ
│   │       └── sampler/
│   │           └── page.tsx     # サンプラーページ
│   ├── favicon.ico              # ファビコン
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # ルートレイアウト
│   └── page.tsx                 # ホームページ
├── components/                   # Reactコンポーネント
│   ├── ui/                      # UI基本コンポーネント
│   │   ├── button.tsx           # ボタンコンポーネント
│   │   ├── card.tsx             # カードコンポーネント
│   │   ├── panel.tsx            # パネルコンポーネント
│   │   ├── toggle-button.tsx    # トグルボタン
│   │   ├── oneshot-button.tsx   # ワンショットボタン
│   │   ├── playing-toggle-button.tsx # 再生トグルボタン
│   │   ├── bpm-input.tsx        # BPM入力
│   │   ├── vertical-divider.tsx # 垂直区切り線
│   │   └── reconnect-modal.tsx  # 再接続モーダル
│   ├── icons/                   # アイコンコンポーネント
│   │   ├── control.tsx          # 制御アイコン
│   │   └── media.tsx            # メディアアイコン
│   ├── DeviceStatusPanel.tsx    # デバイスステータスパネル
│   ├── MediaControlBar.tsx      # メディアコントロールバー
│   ├── MockPanel.tsx            # モックパネル
│   └── VerticalNavigationBar.tsx # 垂直ナビゲーションバー
├── hooks/                       # カスタムフック
│   ├── useAppState.ts           # AppStateフック
│   ├── useMesh.ts               # Mesh接続フック
│   └── usePlayerConrtol.ts     # プレイヤー制御フック
├── lib/                         # ライブラリ
│   ├── srarq/                   # SRARQライブラリ
│   │   └── srarq.ts
│   ├── synthevery-core/         # コアライブラリ
│   │   ├── appstate/            # アプリケーション状態
│   │   │   ├── appstates.ts     # 状態定義
│   │   │   ├── command-clients.ts # コマンドクライアント
│   │   │   ├── constants.ts     # 定数定義
│   │   │   └── sync.ts          # 同期機能
│   │   ├── command/             # コマンドシステム
│   │   │   ├── constants.ts     # コマンド定数
│   │   │   ├── dispatcher.ts    # コマンドディスパッチャー
│   │   │   ├── handler.ts       # コマンドハンドラー
│   │   │   └── util.ts          # ユーティリティ
│   │   ├── connection/          # 通信機能
│   │   │   ├── arq-packet-handler.ts # ARQパケットハンドラー
│   │   │   ├── ble.ts           # BLE通信
│   │   │   ├── constants.ts     # 通信定数
│   │   │   ├── mesh.ts          # Meshネットワーク
│   │   │   ├── srarq/           # SRARQ通信
│   │   │   │   ├── adapter.ts   # SRARQアダプター
│   │   │   │   ├── mock.ts      # SRARQモック
│   │   │   │   └── session.ts   # SRARQセッション
│   │   │   └── util.ts          # 通信ユーティリティ
│   │   ├── data-transfer/       # データ転送
│   │   │   ├── command-client.ts # データ転送コマンドクライアント
│   │   │   ├── constants.ts     # データ転送定数
│   │   │   ├── crc.ts           # CRC計算
│   │   │   ├── data-transfer-controller.ts # データ転送コントローラー
│   │   │   ├── interfaces.ts    # データ転送インターフェース
│   │   │   ├── json-store.ts    # JSONストア
│   │   │   ├── session-list.ts  # セッションリスト
│   │   │   └── session.ts       # セッション管理
│   │   ├── devicetype/          # デバイスタイプ
│   │   │   ├── constants.ts     # デバイスタイプ定数
│   │   │   ├── devicetype.ts    # デバイスタイプ定義
│   │   │   ├── node-role-synchronizer.ts # ノードロール同期
│   │   │   ├── node-role.ts     # ノードロール
│   │   │   └── role-packet-handler.ts # ロールパケットハンドラー
│   │   ├── player/              # プレイヤー機能
│   │   │   ├── config.ts        # プレイヤー設定
│   │   │   ├── controller.ts    # プレイヤーコントローラー
│   │   │   ├── states.ts        # プレイヤー状態
│   │   │   └── util.ts          # プレイヤーユーティリティ
│   │   └── synthevery-architecture.md # アーキテクチャドキュメント
│   └── utils.ts                 # ユーティリティ関数
├── types/                       # TypeScript型定義
│   ├── appstate.ts              # AppState型定義
│   ├── command.ts               # コマンド型定義
│   └── mesh.ts                  # Mesh型定義
├── docs/                        # ドキュメント
│   ├── main-panels/             # メインパネル仕様
│   │   ├── spec_instrument_select_panel.md # 楽器選択パネル仕様
│   │   └── spec_instrument_select_panel_mock.png # モック画像
│   └── specification/           # 仕様書
│       ├── README.md            # 仕様書メイン
│       ├── overview.md          # システム概要
│       ├── plan.md              # 作成計画
│       ├── device/              # デバイス仕様
│       │   ├── hardware.md      # ハードウェア仕様
│       │   ├── communication.md # 通信仕様
│       │   └── audio.md         # 音声処理仕様
│       ├── app/                 # アプリケーション仕様
│       │   ├── architecture.md  # アーキテクチャ仕様
│       │   ├── features.md      # 機能仕様
│       │   └── ui-ux.md        # UI/UX仕様
│       └── technical/           # 技術仕様
│           ├── protocols.md     # 通信プロトコル詳細
│           └── development.md   # 開発環境・技術仕様
├── public/                      # 静的ファイル
│   ├── next.svg                 # Next.jsロゴ
│   └── vercel.svg               # Vercelロゴ
├── components.json              # UIコンポーネント設定
├── jest.config.ts               # Jest設定
├── jest.setup.ts                # Jestセットアップ
├── next.config.mjs              # Next.js設定
├── package.json                 # パッケージ設定
├── postcss.config.mjs           # PostCSS設定
├── README.md                    # プロジェクトREADME
├── tsconfig.json                # TypeScript設定
└── Dockerfile                   # Docker設定
```

### ファイル命名規則

#### コンポーネントファイル
- **PascalCase**: `MediaControlBar.tsx`
- **機能別ディレクトリ**: `ui/`, `icons/`
- **接頭辞**: 必要に応じて接頭辞を使用

#### フックファイル
- **camelCase**: `useAppState.ts`
- **use接頭辞**: カスタムフックは`use`で開始

#### ライブラリファイル
- **kebab-case**: `arq-packet-handler.ts`
- **機能別ディレクトリ**: `appstate/`, `command/`, `connection/`

#### 型定義ファイル
- **camelCase**: `appstate.ts`
- **単数形**: 型定義は単数形で命名

## 開発ガイドライン

### コーディング規約

#### TypeScript規約
```typescript
// 型定義
interface ComponentProps {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

// 関数定義
const Component: React.FC<ComponentProps> = ({ className, children, onClick }) => {
    return (
        <div className={className} onClick={onClick}>
            {children}
        </div>
    );
};

// エクスポート
export { Component };
export type { ComponentProps };
```

#### React規約
```typescript
// 関数コンポーネント
const Component: React.FC<Props> = (props) => {
    // フックは最上部
    const [state, setState] = useState(initialState);
    const { data } = useCustomHook();
    
    // イベントハンドラー
    const handleClick = useCallback(() => {
        // 処理
    }, []);
    
    // レンダリング
    return (
        <div>
            {/* JSX */}
        </div>
    );
};
```

#### CSS規約
```css
/* Tailwind CSS優先 */
.class-name {
    @apply bg-blue-500 text-white p-4 rounded;
}

/* カスタムCSSは必要最小限 */
.custom-class {
    /* カスタムスタイル */
}
```

### テスト規約

#### 単体テスト
```typescript
// コンポーネントテスト
describe('Component', () => {
    it('renders correctly', () => {
        render(<Component />);
        expect(screen.getByText('text')).toBeInTheDocument();
    });
    
    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Component onClick={handleClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalled();
    });
});
```

#### フックテスト
```typescript
// フックテスト
describe('useCustomHook', () => {
    it('returns expected value', () => {
        const { result } = renderHook(() => useCustomHook());
        expect(result.current.value).toBe(expectedValue);
    });
});
```

### コミット規約

#### コミットメッセージ形式
```
type(scope): description

feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

#### 例
```
feat(player): add synthesizer page
fix(connection): resolve BLE connection timeout
docs(spec): update architecture documentation
style(ui): improve button component styling
```

## ビルド・デプロイ

### ビルド設定

#### Next.js設定
```javascript
// next.config.mjs
const nextConfig = {
    experimental: {
        appDir: true,
    },
    images: {
        domains: ['localhost'],
    },
    webpack: (config) => {
        // カスタム設定
        return config;
    },
};
```

#### TypeScript設定
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### デプロイ設定

#### Vercel設定
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

#### Docker設定
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 依存関係インストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 本番環境
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## パフォーマンス要件

### フロントエンドパフォーマンス

#### 読み込み時間
- **First Contentful Paint**: 1.5秒以下
- **Largest Contentful Paint**: 2.5秒以下
- **Cumulative Layout Shift**: 0.1以下
- **First Input Delay**: 100ms以下

#### ランタイムパフォーマンス
- **フレームレート**: 60fps維持
- **メモリ使用量**: 100MB以下
- **CPU使用率**: 10%以下（アイドル時）

### 通信パフォーマンス

#### BLE通信
- **接続時間**: 5秒以下
- **レイテンシ**: 50ms以下
- **スループット**: 1Mbps以上

#### Mesh通信
- **パケット遅延**: 100ms以下
- **パケットロス率**: 1%以下
- **同時接続数**: 8台以上

## セキュリティ要件

### 通信セキュリティ

#### BLEセキュリティ
- **暗号化**: AES-128暗号化
- **認証**: デバイス認証
- **権限管理**: 読み取り/書き込み権限

#### アプリケーションセキュリティ
- **入力検証**: ユーザー入力の検証
- **XSS対策**: コンテンツセキュリティポリシー
- **CSRF対策**: トークンベース認証

### データセキュリティ

#### データ保護
- **暗号化**: 機密データの暗号化
- **アクセス制御**: 適切なアクセス制御
- **監査ログ**: セキュリティイベントの記録

## 監視・ログ

### ログ設定

#### ログレベル
```typescript
enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
```

#### ログ出力
```typescript
// エラーログ
console.error('Error message', error);

// 警告ログ
console.warn('Warning message');

// 情報ログ
console.info('Info message');

// デバッグログ
console.debug('Debug message');
```

### 監視項目

#### パフォーマンス監視
- **ページ読み込み時間**
- **API応答時間**
- **メモリ使用量**
- **CPU使用率**

#### エラー監視
- **JavaScriptエラー**
- **ネットワークエラー**
- **BLE接続エラー**
- **Mesh通信エラー**

## 将来の技術計画

### 短期的改善（3-6ヶ月）

#### パフォーマンス改善
- **WebAssembly**: 重い処理のWASM化
- **Web Workers**: バックグラウンド処理
- **Service Worker**: オフライン対応

#### 機能拡張
- **PWA対応**: ネイティブアプリ化
- **オフライン機能**: ネットワーク不要での操作
- **プッシュ通知**: リアルタイム通知

### 中期的改善（6-12ヶ月）

#### 技術スタック更新
- **React 19**: 最新バージョンへの移行
- **Next.js 15**: 最新機能の活用
- **TypeScript 5.5**: 最新型システムの活用

#### アーキテクチャ改善
- **マイクロフロントエンド**: 機能別の分割
- **外部ライブラリ分離**: synthevery-coreの独立
- **API設計**: RESTful APIの導入

### 長期的改善（1年以上）

#### 先進技術導入
- **WebRTC**: リアルタイム協調
- **WebGPU**: GPU加速処理
- **WebAssembly SIMD**: SIMD最適化

#### AI・ML機能
- **機械学習**: 自動伴奏生成
- **音声認識**: 音声による操作
- **楽曲分析**: 楽曲の自動分析 