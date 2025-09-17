import React from 'react';
import { cn } from '@/lib/utils';
import { InstrumentIcon } from '@/components/icons/InstrumentIcon';
import { TrackDetail } from '@/lib/synthevery-core/types/player';

export interface TrackCardProps {
    trackIndex: number;
    trackDetail: TrackDetail;
    isSelected: boolean;
    isMultiSelected?: boolean;
    deviceCount?: number;
    onSelect: (trackIndex: number) => void;
    onEdit: (trackIndex: number) => void;
    className?: string;
}

/**
 * トラックカードコンポーネント
 */
export const TrackCard: React.FC<TrackCardProps> = ({
    trackIndex,
    trackDetail,
    isSelected,
    isMultiSelected = false,
    deviceCount = 0,
    onSelect,
    onEdit,
    className
}) => {
    const handleClick = () => {
        onSelect(trackIndex);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(trackIndex);
    };

    const getBorderClasses = () => {
        if (isSelected) {
            return isMultiSelected
                ? 'ring-2 ring-white/80 ring-inset' // 複数選択状態（中太の白い枠線）
                : 'ring-2 ring-white ring-inset';   // 単一選択状態（太い白い枠線）
        }
        return 'ring ring-gray-400/30 ring-inset'; // 非選択状態（薄いグレーの細い枠線）
    };

    const getBackgroundClasses = () => {
        return 'bg-transparent hover:bg-gray-700/40';
    };

    return (
        <div
            data-slot="track-card"
            className={cn(
                'relative rounded-lg p-2 cursor-pointer transition-all duration-200',
                'flex flex-col items-center justify-center-safe gap-2',
                'min-h-0 h-full w-full',
                'overflow-hidden',
                getBorderClasses(),
                getBackgroundClasses(),
                className
            )}
            onClick={handleClick}
        >
            {/* トラック番号と楽器名とEDITボタン */}
            <div className="flex-none overflow-hidden min-h-[40px] content-center w-full">
                <div className="text-center flex items-center gap-1 justify-center w-full">
                    <div className="text-xs sm:text-sm font-medium text-gray-300 leading-tight truncate max-w-[120px] sm:max-w-[140px]">
                        {trackIndex + 1}: {trackDetail.displayName}
                    </div>
                    {/* EDITボタン（選択時のみ表示） */}
                    {isSelected && (
                        <button
                            data-slot="edit-button"
                            onClick={handleEditClick}
                            className={cn(
                                'px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded',
                                'bg-gray-600/80 text-gray-200 hover:bg-gray-500/80',
                                'transition-colors duration-200',
                                'border border-gray-500/50',
                                'flex-shrink-0'
                            )}
                        >
                            EDIT
                        </button>
                    )}
                </div>
            </div>

            {/* 楽器アイコン（カードの短い辺の80%を基準にサイズ調整） */}
            <div className="relative justify-center w-full h-full flex items-center justify-center rounded-lg">
                <InstrumentIcon
                    icon={trackDetail.icon}
                    className="absolute text-gray-300"
                />
            </div>

            {/* デバイス数表示（複数選択時のみ） */}
            {isMultiSelected && deviceCount > 0 && (
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex items-center gap-1">
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-400">x{deviceCount}</span>
                </div>
            )}
        </div>
    );
};
