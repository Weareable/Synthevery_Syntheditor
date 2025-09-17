// app/layout.tsx
import './globals.css';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SyntheveryProvider } from '@/contexts/SyntheveryContext';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

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
    <>
      <html lang="ja" suppressHydrationWarning className={montserrat.variable}>
        <head />
        <body className="font-montserrat">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SyntheveryProvider>
              {children}
            </SyntheveryProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
