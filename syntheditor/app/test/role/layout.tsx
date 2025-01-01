// app/layout.tsx
import type { Metadata } from 'next';
import { BLEProvider } from '@/providers/ble-provider';
import { MeshProvider } from '@/providers/mesh-provider';
import { DeviceTypeProvider } from '@/providers/device-type-provider';

export const metadata: Metadata = {
    title: 'My App',
    description: 'Generated by create next app',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja">
            <body>
                <BLEProvider>
                    <MeshProvider>
                        <DeviceTypeProvider>
                            {children}
                        </DeviceTypeProvider>
                    </MeshProvider>
                </BLEProvider>
            </body>
        </html>
    );
}