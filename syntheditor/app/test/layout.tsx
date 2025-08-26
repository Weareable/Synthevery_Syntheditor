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
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
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
                <div className="light">
                    {children}
                </div>
            </SyntheveryProvider>
        </ThemeProvider>
    );
}
