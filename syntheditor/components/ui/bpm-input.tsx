import React, { useState, useRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const bpmInputVariants = cva(
    "flex items-center justify-center gap-1 w-32 h-10 rounded-sm border border-border bg-background select-none",
    {
        variants: {
            color: {
                default: "",
            },
            rounded: {
                md: "rounded-sm",
                full: "rounded-full",
            },
            size: {
                default: "h-10 w-32 text-sm",
                sm: "h-8 w-24 text-xs",
            },
        },
        defaultVariants: {
            color: "default",
            rounded: "md",
            size: "default",
        },
    }
);

type ColorType = "default";
type RoundedType = "md" | "full";
type SizeType = "default" | "sm";

interface BPMInputProps extends React.HTMLAttributes<HTMLDivElement> {
    min?: number;
    max?: number;
    value?: number;
    onBpmChange?: (bpm: number) => void;
    color?: ColorType;
    rounded?: RoundedType;
    size?: SizeType;
}

const DEFAULT_MIN = 40;
const DEFAULT_MAX = 300;
const DEFAULT_BPM = 120;
const LONG_PRESS_DELAY = 400; // ms

export const BPMInput: React.FC<BPMInputProps> = ({
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
    value,
    onBpmChange,
    className,
    color = "default",
    rounded = "md",
    size = "default",
    ...props
}) => {
    const [bpm, setBpm] = useState<number>(value ?? DEFAULT_BPM);
    // ボタン長押し用interval/timeoutを左右で分離
    const leftIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const rightIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const leftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // ボタン長押し中フラグ
    const leftPressing = useRef(false);
    const rightPressing = useRef(false);
    // ドラッグ用
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragStartBpm = useRef(bpm);

    // タッチ後のゴーストマウスイベント防止用
    const isTouching = useRef(false);
    const TOUCH_RELEASE_DELAY = 500; // ms
    let touchReleaseTimeout: NodeJS.Timeout | null = null;

    const [isDraggingState, setIsDraggingState] = useState(false); // ポップアップ用
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ポップアップ遅延非表示用
    const POPUP_HIDE_DELAY = 400; // ms

    // BPM変更時のコールバック
    const updateBpm = (newBpm: number | ((prev: number) => number)) => {
        setBpm(prev => {
            const value = typeof newBpm === 'function' ? newBpm(prev) : newBpm;
            const clamped = Math.max(min, Math.min(max, value));
            onBpmChange?.(clamped);
            return clamped;
        });
    };

    // ボタン長押し（左: -1, 右: +1）
    const handlePressStart = (delta: number, isTouch = false) => {
        if (isDragging.current) return; // ドラッグ中は無効
        if (!isTouch && isTouching.current) return; // タッチ中はマウスイベント無視
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current); // 非表示タイマー解除
        setIsDraggingState(true); // ポップアップ表示
        if (delta === -1) {
            leftPressing.current = true;
            updateBpm(bpm - 1); // まず1回だけ即時
            leftTimeoutRef.current = setTimeout(() => {
                if (leftPressing.current) {
                    leftIntervalRef.current = setInterval(() => {
                        updateBpm(prev => prev - 1);
                    }, 80);
                }
            }, LONG_PRESS_DELAY);
        } else if (delta === 1) {
            rightPressing.current = true;
            updateBpm(bpm + 1); // まず1回だけ即時
            rightTimeoutRef.current = setTimeout(() => {
                if (rightPressing.current) {
                    rightIntervalRef.current = setInterval(() => {
                        updateBpm(prev => prev + 1);
                    }, 80);
                }
            }, LONG_PRESS_DELAY);
        }
    };
    const handlePressEnd = (delta: number) => {
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = setTimeout(() => setIsDraggingState(false), POPUP_HIDE_DELAY);
        if (delta === -1) {
            leftPressing.current = false;
            if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
            leftTimeoutRef.current = null;
            if (leftIntervalRef.current) clearInterval(leftIntervalRef.current);
            leftIntervalRef.current = null;
        } else if (delta === 1) {
            rightPressing.current = false;
            if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
            rightTimeoutRef.current = null;
            if (rightIntervalRef.current) clearInterval(rightIntervalRef.current);
            rightIntervalRef.current = null;
        }
    };
    // ドラッグ開始時にボタン長押し中なら即クリア
    const clearAllPress = () => {
        leftPressing.current = false;
        rightPressing.current = false;
        if (leftTimeoutRef.current) clearTimeout(leftTimeoutRef.current);
        if (rightTimeoutRef.current) clearTimeout(rightTimeoutRef.current);
        if (leftIntervalRef.current) clearInterval(leftIntervalRef.current);
        if (rightIntervalRef.current) clearInterval(rightIntervalRef.current);
    };

    // スライド操作
    const handleDragStart = (clientX: number, isTouch = false) => {
        if (!isTouch && isTouching.current) return; // タッチ中はマウスイベント無視
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current); // 非表示タイマー解除
        clearAllPress(); // ボタン長押し中なら解除
        isDragging.current = true;
        setIsDraggingState(true); // ポップアップ表示
        dragStartX.current = clientX;
        dragStartBpm.current = bpm;
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
        window.addEventListener("touchcancel", handleTouchEnd);
    };
    const handleDragMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStartX.current;
        const newBpm = dragStartBpm.current + dx * 0.2;
        updateBpm(Math.round(newBpm));
    };
    const handleDragEnd = () => {
        isDragging.current = false;
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = setTimeout(() => setIsDraggingState(false), POPUP_HIDE_DELAY);
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchEnd);
    };
    // タッチ用
    const handleTouchStart = (e: React.TouchEvent) => {
        isTouching.current = true;
        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
        if (e.touches.length === 1) {
            handleDragStart(e.touches[0].clientX, true);
        }
    };
    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        if (e.touches.length === 1) {
            const dx = e.touches[0].clientX - dragStartX.current;
            const newBpm = dragStartBpm.current + dx * 0.2;
            updateBpm(Math.round(newBpm));
        }
    };
    const handleTouchEnd = () => {
        handleDragEnd();
        // タッチ終了後も少し遅らせて解除
        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
        touchReleaseTimeout = setTimeout(() => {
            isTouching.current = false;
        }, TOUCH_RELEASE_DELAY);
    };

    return (
        <div className="relative inline-block">
            {/* スライド・ボタン長押し中はポップアップをフェード表示（本体の真上） */}
            <div
                className={
                    `w-40 absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                    bg-background/90 border border-border rounded-lg px-8 py-4 shadow-lg flex flex-col items-center
                    transition-opacity duration-300
                    ${isDraggingState ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'}`
                }
                style={{ pointerEvents: 'none' }}
            >
                <span className="text-5xl font-bold text-primary drop-shadow-lg select-none">{bpm}</span>
                <span className="text-base text-muted-foreground font-bold tracking-wider mt-1 select-none">BPM</span>
            </div>
            <div
                className={cn(bpmInputVariants({ color, rounded, size }), className)}
                onMouseDown={e => handleDragStart(e.clientX)}
                onTouchStart={handleTouchStart}
                {...props}
            >
                <button
                    type="button"
                    className="bg-transparent border-none text-muted-foreground text-[0.5rem] cursor-pointer px-1 py-0.5 select-none"
                    onMouseDown={e => {
                        e.stopPropagation();
                        handlePressStart(-1);
                    }}
                    onMouseUp={e => handlePressEnd(-1)}
                    onMouseLeave={e => handlePressEnd(-1)}
                    onTouchStart={e => {
                        e.stopPropagation();
                        isTouching.current = true;
                        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
                        handlePressStart(-1, true);
                    }}
                    onTouchEnd={e => handlePressEnd(-1)}
                    onTouchCancel={e => handlePressEnd(-1)}
                    aria-label="BPM down"
                >
                    &#x25C0;
                </button>
                <span
                    className="font-bold text-xs text-muted-foreground tracking-wider mx-1 select-none"
                >
                    BPM
                </span>
                <span
                    className="flex-1 text-primary text-sm font-normal text-right select-none"
                >
                    {bpm}
                </span>
                <button
                    type="button"
                    className="bg-transparent border-none text-muted-foreground text-[0.5rem] cursor-pointer px-1 py-0.5 select-none"
                    onMouseDown={e => {
                        e.stopPropagation();
                        handlePressStart(1);
                    }}
                    onMouseUp={e => handlePressEnd(1)}
                    onMouseLeave={e => handlePressEnd(1)}
                    onTouchStart={e => {
                        e.stopPropagation();
                        isTouching.current = true;
                        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
                        handlePressStart(1, true);
                    }}
                    onTouchEnd={e => handlePressEnd(1)}
                    onTouchCancel={e => handlePressEnd(1)}
                    aria-label="BPM up"
                >
                    &#x25B6;
                </button>
            </div>
        </div>
    );
};

export default BPMInput;
