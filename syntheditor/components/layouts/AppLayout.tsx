import { VerticalNavigationBar } from '@/components/VerticalNavigationBar'
import { DeviceStatusPanel } from '@/components/DeviceStatusPanel'
import { MediaControlBar } from '@/components/MediaControlBar'
import React from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <div className="flex flex-1 overflow-hidden">
        {/* 左ナビゲーションバー */}
        <aside className="w-16 bg-zinc-900 border-r flex-shrink-0 flex flex-col items-center py-2">
          <VerticalNavigationBar />
        </aside>
        {/* メイン表示領域 */}
        <main className="flex-1 overflow-auto bg-zinc-800 flex items-center justify-center">
          {children}
        </main>
        {/* デバイスステータス領域 */}
        <aside className="w-64 bg-zinc-900 border-l flex-shrink-0 flex flex-col items-center py-2">
          <DeviceStatusPanel />
        </aside>
      </div>
      {/* メディアコントロールバー */}
      <footer className="h-20 bg-zinc-900 border-t flex items-center justify-center">
        <MediaControlBar />
      </footer>
    </div>
  )
} 