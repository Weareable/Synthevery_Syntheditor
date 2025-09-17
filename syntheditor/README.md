# Synthevery Syntheditor

Syntheveryは、メッシュネットワーク上で音楽制作デバイスを連携させるためのWebアプリケーションです。このプロジェクトはNext.jsで構築されています。

## 主要機能

### DeviceConfigManager
メッシュネットワーク上のデバイスからNoteBuilderConfigを自動的に取得・管理する機能です。

- **自動設定管理**: 新規デバイス接続時に自動でNoteBuilderConfigをリクエスト
- **送信元特定**: 受信した設定がどのデバイスから送信されたかを正確に特定
- **リアルタイム更新**: デバイス接続・切断時にリアルタイムで設定を更新

詳細は [DeviceConfigManager仕様書](./docs/specification/device/device-config-manager.md) を参照してください。

### メッシュネットワーク機能
- BLE経由でのデバイス接続
- データ転送機能
- リアルタイム通信

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
