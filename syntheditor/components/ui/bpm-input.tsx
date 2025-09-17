import React from "react";
import { DraggableNumberInput } from "./draggable-number-input";

interface BPMInputProps {
    min?: number;
    max?: number;
    value?: number;
    onBpmChange?: (bpm: number) => void;
    className?: string;
}

const DEFAULT_MIN = 40;
const DEFAULT_MAX = 300;
const DEFAULT_BPM = 120;

export const BPMInput: React.FC<BPMInputProps> = ({
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
    value,
    onBpmChange,
    className,
}) => {
    return (
        <DraggableNumberInput
            min={min}
            max={max}
            value={value}
            onValueChange={onBpmChange}
            label="BPM"
            step={1}
            dragSensitivity={0.2}
            showPopup={true}
            popupLabel="BPM"
            className={className}
        />
    );
};

export default BPMInput;
