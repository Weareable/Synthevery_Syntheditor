import React from 'react';
import { cn } from '@/lib/utils';

export interface InstrumentIconProps {
    icon: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
    className?: string;
}

/**
 * 楽器アイコンコンポーネント
 */
export const InstrumentIcon: React.FC<InstrumentIconProps> = ({
    icon,
    className
}) => {
    const renderIcon = () => {
        switch (icon) {
            case 'piano':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
                        {/* ピアノ鍵盤のアイコン */}
                        <rect x="2" y="8" width="20" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        {/* 白鍵 */}
                        <rect x="2" y="8" width="3" height="12" fill="currentColor" opacity="0.1" />
                        <rect x="6" y="8" width="3" height="12" fill="currentColor" opacity="0.1" />
                        <rect x="10" y="8" width="3" height="12" fill="currentColor" opacity="0.1" />
                        <rect x="14" y="8" width="3" height="12" fill="currentColor" opacity="0.1" />
                        <rect x="18" y="8" width="3" height="12" fill="currentColor" opacity="0.1" />
                        {/* 黒鍵 */}
                        <rect x="4.5" y="8" width="1.5" height="8" fill="currentColor" />
                        <rect x="8.5" y="8" width="1.5" height="8" fill="currentColor" />
                        <rect x="12.5" y="8" width="1.5" height="8" fill="currentColor" />
                        <rect x="16.5" y="8" width="1.5" height="8" fill="currentColor" />
                    </svg>
                );

            case 'guitar':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* ギターのアイコン */}
                        <ellipse cx="12" cy="16" rx="8" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="11" y="4" width="2" height="12" fill="currentColor" />
                        <circle cx="12" cy="6" r="1" fill="currentColor" />
                        <circle cx="12" cy="9" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                    </svg>
                );

            case 'drums':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* ドラムのアイコン */}
                        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        {/* ドラムスティック */}
                        <line x1="4" y1="4" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="20" y1="20" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                );

            case 'synth':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* シンセサイザーのアイコン */}
                        <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="4" y="8" width="3" height="8" fill="currentColor" opacity="0.2" />
                        <rect x="8" y="8" width="3" height="8" fill="currentColor" opacity="0.2" />
                        <rect x="12" y="8" width="3" height="8" fill="currentColor" opacity="0.2" />
                        <rect x="16" y="8" width="3" height="8" fill="currentColor" opacity="0.2" />
                        {/* 波形 */}
                        <path d="M4 16 L6 14 L8 16 L10 14 L12 16 L14 14 L16 16 L18 14 L20 16"
                            stroke="currentColor" strokeWidth="1" fill="none" />
                    </svg>
                );

            case 'bass':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* ベースギターのアイコン */}
                        <ellipse cx="12" cy="16" rx="6" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="11" y="4" width="2" height="12" fill="currentColor" />
                        <circle cx="12" cy="6" r="1" fill="currentColor" />
                        <circle cx="12" cy="9" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                    </svg>
                );

            case 'strings':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* 弦楽器のアイコン */}
                        <ellipse cx="12" cy="16" rx="6" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="11" y="4" width="2" height="12" fill="currentColor" />
                        <circle cx="12" cy="6" r="1" fill="currentColor" />
                        <circle cx="12" cy="9" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        {/* 弓 */}
                        <path d="M6 8 Q12 4 18 8" stroke="currentColor" strokeWidth="1" fill="none" />
                    </svg>
                );

            case 'brass':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* 金管楽器のアイコン */}
                        <path d="M8 8 Q12 4 16 8 Q12 12 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <rect x="11" y="8" width="2" height="8" fill="currentColor" />
                        <circle cx="12" cy="10" r="1" fill="currentColor" />
                        <circle cx="12" cy="13" r="1" fill="currentColor" />
                        <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                );

            case 'woodwind':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* 木管楽器のアイコン */}
                        <rect x="8" y="6" width="8" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="10" cy="9" r="1" fill="currentColor" />
                        <circle cx="10" cy="12" r="1" fill="currentColor" />
                        <circle cx="10" cy="15" r="1" fill="currentColor" />
                        <circle cx="14" cy="9" r="1" fill="currentColor" />
                        <circle cx="14" cy="12" r="1" fill="currentColor" />
                        <circle cx="14" cy="15" r="1" fill="currentColor" />
                    </svg>
                );

            default:
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* デフォルトの音符アイコン */}
                        <ellipse cx="12" cy="16" rx="3" ry="2" fill="currentColor" />
                        <rect x="15" y="4" width="2" height="12" fill="currentColor" />
                        <path d="M17 4 L17 8 L21 6 L17 4" fill="currentColor" />
                    </svg>
                );
        }
    };


    return (
        <div
            data-slot="instrument-icon"
            className={cn(
                'w-full h-full',
                'flex items-center justify-center',
                className
            )}
        >
            {renderIcon()}
        </div>
    );
};
