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
                        {/* ギターボディ */}
                        <ellipse cx="9" cy="16" rx="5.5" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="16" r="1.2" fill="currentColor" opacity="0.35" />
                        {/* ネック（斜めの四角形） */}
                        <path d="M12 12 L20 4 L21.2 5.2 L13.2 13.2 Z" fill="currentColor" />
                        {/* ヘッド部のペグ */}
                        <circle cx="20.4" cy="3.8" r="0.6" fill="currentColor" />
                        <circle cx="21.6" cy="5.0" r="0.6" fill="currentColor" />
                        <circle cx="20.8" cy="6.2" r="0.6" fill="currentColor" />
                        {/* 弦（ストラム方向を示す斜めライン） */}
                        <line x1="6" y1="13.5" x2="18" y2="1.5" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
                        <line x1="6" y1="15" x2="18.5" y2="3" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
                        <line x1="6" y1="16.5" x2="19" y2="4.5" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
                    </svg>
                );

            case 'drum':
            case 'drums':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* スネアドラム */}
                        <ellipse cx="12" cy="14" rx="7" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <ellipse cx="12" cy="13" rx="7" ry="3" fill="currentColor" opacity="0.15" />
                        {/* ドラムスティック */}
                        <line x1="5" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        <line x1="19" y1="6" x2="13" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                );
            case 'bongo':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* ボンゴ2連 */}
                        <ellipse cx="8.5" cy="12.5" rx="4" ry="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <ellipse cx="15.5" cy="12.5" rx="4" ry="3" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        <ellipse cx="8.5" cy="12.2" rx="3.7" ry="2.6" fill="currentColor" opacity="0.15" />
                        <ellipse cx="15.5" cy="12.2" rx="3.7" ry="2.6" fill="currentColor" opacity="0.15" />
                        <rect x="8.5" y="15" width="7" height="0.8" fill="currentColor" opacity="0.9" />
                    </svg>
                );
            case 'trap_drum':
            case 'yaw_drum':
                return (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        {/* バスドラム + ペダル風 */}
                        <circle cx="12" cy="13" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="13" r="3.5" fill="currentColor" opacity="0.15" />
                        <line x1="16" y1="17" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />
                        <circle cx="20.5" cy="20.5" r="0.9" fill="currentColor" />
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
