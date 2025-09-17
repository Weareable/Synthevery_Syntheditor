// app/test/layout.tsx
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { SyntheveryProvider } from '@/contexts/SyntheveryContext';
import { useEffect } from 'react';

export default function TestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // 強制的にライトテーマを適用
        const applyLightTheme = () => {
            // HTML要素にライトクラスを追加
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');

            // body要素にもライトクラスを追加
            document.body.classList.remove('dark');
            document.body.classList.add('light');

            // データ属性も設定
            document.documentElement.setAttribute('data-theme', 'light');
        };

        // 即座に適用
        applyLightTheme();

        // 少し遅延して再適用（他のスクリプトが上書きした場合の対策）
        const timer = setTimeout(applyLightTheme, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <SyntheveryProvider>
                <div className="light min-h-screen bg-background text-foreground">
                    {children}
                </div>
            </SyntheveryProvider>
        </ThemeProvider>
    );
}
