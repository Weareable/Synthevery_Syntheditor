import { VerticalNavigationBar } from '@/components/VerticalNavigationBar'
import { DeviceStatusPanel } from '@/components/DeviceStatusPanel'
import { MediaControlBar } from '@/components/MediaControlBar'
import React from 'react'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-background gap-2 p-2">
            <div className="flex flex-1 overflow-hidden gap-2">
                {/* 左ナビゲーションバー */}
                <aside className="flex-none justify-center">
                    <VerticalNavigationBar />
                </aside>
                {/* メイン表示領域 */}
                <main className="flex-1 overflow-auto bg-zinc-800 flex items-center justify-center">
                    {children}
                </main>
                {/* デバイスステータス領域 */}
                <aside className="w-64 bg-zinc-900 border-l flex flex-col items-center py-2">
                    <DeviceStatusPanel />
                </aside>
            </div>
            {/* メディアコントロールバー */}
            <footer className="flex-none bg-background flex items-center justify-center">
                <MediaControlBar />
            </footer>
        </div>
    )
}