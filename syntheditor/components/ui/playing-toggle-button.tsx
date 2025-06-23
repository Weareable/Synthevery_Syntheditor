import React from "react";
import { ToggleButton } from "@/components/ui/toggle-button";
import { PlayIcon, PauseIcon } from "@/components/icons/media";

interface PlayingToggleButtonProps {
    isPlaying: boolean;
    onChange: (isActive: boolean) => void;
    className?: string;
}

export function PlayingToggleButton({ isPlaying, onChange, className }: PlayingToggleButtonProps) {
    return (
        <ToggleButton
            pressed={isPlaying}
            onPressedChange={onChange}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={className}
        >
            {isPlaying ? <PauseIcon width={12} height={12} /> : <PlayIcon width={12} height={12} />}
        </ToggleButton>
    );
} 