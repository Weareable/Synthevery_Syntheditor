import React from 'react';
import { cn } from '@/lib/utils';

export interface AddTrackButtonProps {
    onClick: () => void;
    className?: string;
}

/**
 * 新規トラック追加ボタンコンポーネント
 */
export const AddTrackButton: React.FC<AddTrackButtonProps> = ({
    onClick,
    className
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center justify-center',
                'px-6 py-3 rounded-lg border-2 border-dashed',
                'border-gray-400/30 text-gray-400',
                'hover:border-gray-400/50 hover:text-gray-300',
                'transition-all duration-200',
                'min-h-[120px] min-w-[100px]',
                className
            )}
        >
            <div className="text-3xl font-light">+</div>
        </button>
    );
};
