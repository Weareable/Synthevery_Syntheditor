import React, { useRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const draggableNumberInputVariants = cva(
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

interface DraggableNumberInputProps extends React.HTMLAttributes<HTMLDivElement> {
    min?: number;
    max?: number;
    value?: number;
    onValueChange?: (value: number) => void;
    label?: string;
    unit?: string;
    step?: number;
    dragSensitivity?: number;
    color?: ColorType;
    rounded?: RoundedType;
    size?: SizeType;
    showPopup?: boolean;
    popupLabel?: string;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 999;
const DEFAULT_VALUE = 0;
const DEFAULT_STEP = 1;
const DEFAULT_DRAG_SENSITIVITY = 0.2;
const LONG_PRESS_DELAY = 400; // ms

export const DraggableNumberInput: React.FC<DraggableNumberInputProps> = ({
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
    value,
    onValueChange,
    label,
    unit,
    step = DEFAULT_STEP,
    dragSensitivity = DEFAULT_DRAG_SENSITIVITY,
    className,
    color = "default",
    rounded = "md",
    size = "default",
    showPopup = true,
    popupLabel,
    ...props
}) => {
    const currentValue = value ?? DEFAULT_VALUE;

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
    const dragStartValue = useRef(currentValue);

    // タッチ後のゴーストマウスイベント防止用
    const isTouching = useRef(false);
    const TOUCH_RELEASE_DELAY = 500; // ms
    let touchReleaseTimeout: NodeJS.Timeout | null = null;

    const [isDraggingState, setIsDraggingState] = React.useState(false); // ポップアップ用
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ポップアップ遅延非表示用
    const POPUP_HIDE_DELAY = 400; // ms

    // 値変更時のコールバック
    const updateValue = (newValue: number | ((prev: number) => number)) => {
        if (!onValueChange) return;
        const value = typeof newValue === 'function' ? newValue(currentValue) : newValue;
        const clamped = Math.max(min, Math.min(max, value));
        onValueChange(clamped);
    };

    // ボタン長押し（左: -step, 右: +step）
    const handlePressStart = (delta: number, isTouch = false) => {
        console.debug('🔘 Button Press Start:', { delta, isTouch, isDragging: isDragging.current });
        if (isDragging.current) return; // ドラッグ中は無効
        if (!isTouch && isTouching.current) return; // タッチ中はマウスイベント無視
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current); // 非表示タイマー解除
        setIsDraggingState(true); // ポップアップ表示
        if (delta === -1) {
            leftPressing.current = true;
            updateValue(currentValue - step); // まず1回だけ即時
            console.debug('⬅️ Left button pressed, value updated to:', currentValue - step);
            leftTimeoutRef.current = setTimeout(() => {
                if (leftPressing.current) {
                    leftIntervalRef.current = setInterval(() => {
                        updateValue(prev => prev - step);
                    }, 80);
                }
            }, LONG_PRESS_DELAY);
        } else if (delta === 1) {
            rightPressing.current = true;
            updateValue(currentValue + step); // まず1回だけ即時
            console.debug('➡️ Right button pressed, value updated to:', currentValue + step);
            rightTimeoutRef.current = setTimeout(() => {
                if (rightPressing.current) {
                    rightIntervalRef.current = setInterval(() => {
                        updateValue(prev => prev + step);
                    }, 80);
                }
            }, LONG_PRESS_DELAY);
        }
    };

    const handlePressEnd = (delta: number) => {
        console.debug('🔘 Button Press End:', { delta });
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
        console.debug('🖱️ Drag Start:', { clientX, isTouch, target: 'main container' });
        if (!isTouch && isTouching.current) return; // タッチ中はマウスイベント無視
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current); // 非表示タイマー解除
        clearAllPress(); // ボタン長押し中なら解除
        isDragging.current = true;
        setIsDraggingState(true); // ポップアップ表示
        dragStartX.current = clientX;
        dragStartValue.current = currentValue;
        console.debug('✅ Drag started successfully');
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);
        window.addEventListener("touchcancel", handleTouchEnd);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStartX.current;
        const newValue = dragStartValue.current + dx * dragSensitivity;
        const clampedValue = Math.round(Math.max(min, Math.min(max, newValue)));
        console.debug('🔄 Drag Move:', { dx, newValue, clampedValue, currentValue });
        updateValue(clampedValue);
    };

    const handleDragEnd = () => {
        console.debug('🛑 Drag End');
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
            const newValue = dragStartValue.current + dx * dragSensitivity;
            const clampedValue = Math.round(Math.max(min, Math.min(max, newValue)));
            updateValue(clampedValue);
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
            {showPopup && (
                <div
                    className={
                        `w-40 absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                        bg-background/90 border border-border rounded-lg px-8 py-4 shadow-lg flex flex-col items-center
                        transition-opacity duration-300 z-50
                        ${isDraggingState ? 'opacity-100' : 'opacity-0'}`
                    }
                >
                    <span className="text-5xl font-bold text-primary drop-shadow-lg select-none">{currentValue}</span>
                    {popupLabel && (
                        <span className="text-base text-muted-foreground font-bold tracking-wider mt-1 select-none">
                            {popupLabel}
                        </span>
                    )}
                </div>
            )}
            <div
                className={cn(draggableNumberInputVariants({ color, rounded, size }), className)}
                onMouseDown={e => {
                    console.debug('🖱️ Main container mouseDown:', {
                        target: e.target,
                        isButton: !!(e.target as Element)?.closest('button'),
                        clientX: e.clientX
                    });
                    // ボタン以外の領域でのドラッグ開始
                    if (!e.target || !(e.target as Element).closest('button')) {
                        console.debug('✅ Starting drag from main container');
                        handleDragStart(e.clientX);
                    } else {
                        console.debug('❌ Clicked on button, not starting drag');
                    }
                }}
                onTouchStart={e => {
                    console.debug('👆 Main container touchStart:', {
                        target: e.target,
                        isButton: !!(e.target as Element)?.closest('button'),
                        touches: e.touches.length
                    });
                    // ボタン以外の領域でのタッチドラッグ開始
                    const target = e.target as Element;
                    const isButton = target?.tagName === 'BUTTON' || target?.closest('button');

                    if (!isButton) {
                        console.debug('✅ Starting touch drag from main container');
                        handleTouchStart(e);
                    } else {
                        console.debug('❌ Touched button, not starting drag');
                        // ボタンタッチの場合はイベントを停止
                        e.stopPropagation();
                    }
                }}
                {...props}
            >
                <button
                    type="button"
                    className="bg-transparent text-muted-foreground text-[0.5rem] cursor-pointer px-0 py-0 select-none w-3 h-3 flex items-center justify-center"
                    onMouseDown={e => {
                        e.stopPropagation();
                        handlePressStart(-1);
                    }}
                    onMouseUp={e => handlePressEnd(-1)}
                    onMouseLeave={e => handlePressEnd(-1)}
                    onTouchStart={e => {
                        e.stopPropagation();
                        // タッチ操作ではボタン処理のみ
                        isTouching.current = true;
                        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
                        handlePressStart(-1, true);
                    }}
                    onTouchEnd={e => {
                        e.stopPropagation();
                        handlePressEnd(-1);
                    }}
                    onTouchCancel={e => {
                        e.stopPropagation();
                        handlePressEnd(-1);
                    }}
                    aria-label={`Decrease ${label || 'value'}`}
                >
                    &#x25C0;
                </button>
                {label && (
                    <span className="font-bold text-xs text-muted-foreground tracking-wider mx-1 select-none">
                        {label}
                    </span>
                )}
                <span
                    className={cn(
                        "text-primary text-sm font-normal select-none",
                        label ? "flex-1 text-right" : "flex-1 text-center"
                    )}
                >
                    {currentValue}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
                </span>
                <button
                    type="button"
                    className="bg-transparent text-muted-foreground text-[0.5rem] cursor-pointer px-0 py-0 select-none w-3 h-3 flex items-center justify-center"
                    onMouseDown={e => {
                        e.stopPropagation();
                        handlePressStart(1);
                    }}
                    onMouseUp={e => handlePressEnd(1)}
                    onMouseLeave={e => handlePressEnd(1)}
                    onTouchStart={e => {
                        e.stopPropagation();
                        // タッチ操作ではボタン処理のみ
                        isTouching.current = true;
                        if (touchReleaseTimeout) clearTimeout(touchReleaseTimeout);
                        handlePressStart(1, true);
                    }}
                    onTouchEnd={e => {
                        e.stopPropagation();
                        handlePressEnd(1);
                    }}
                    onTouchCancel={e => {
                        e.stopPropagation();
                        handlePressEnd(1);
                    }}
                    aria-label={`Increase ${label || 'value'}`}
                >
                    &#x25B6;
                </button>
            </div>
        </div>
    );
};

export default DraggableNumberInput;
