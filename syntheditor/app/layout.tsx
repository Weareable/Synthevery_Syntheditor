// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'My BLE + Mesh App',
  description: 'A Next.js app with BLE and Mesh functionalities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
