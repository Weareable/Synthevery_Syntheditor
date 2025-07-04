import React from 'react'

export default function ConnectionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
    )
} 