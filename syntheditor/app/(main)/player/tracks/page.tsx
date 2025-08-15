'use client';

import React from 'react';
import { TrackSelectPanel } from '@/components/tracks/TrackSelectPanel';

/**
 * トラック選択パネルのテストページ
 */
export default function TracksPage() {
    // 楽器編集のハンドラー
    const handleEditTrack = (trackIndex: number) => {
        console.log(`Edit track ${trackIndex}`);
        // TODO: 楽器選択画面への遷移
    };

    return (
        <div className="w-full h-full bg-background">
            <TrackSelectPanel
                onEditTrack={handleEditTrack}
            />
        </div>
    );
}
