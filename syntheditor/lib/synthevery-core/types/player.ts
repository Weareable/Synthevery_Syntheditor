export interface TickClockState {
    playing: boolean;
    bpm: number;
    originTimeUs: number;
}

export interface TrackState {
    loopLengthTick: number;
    mute: boolean;
    volume: number;
}

export interface NoteBuilderConfig {
    type: string;
    // 基本的なモーション検知設定
    sensitivity?: number;           // 感度（0.0 - 1.0）
    threshold?: number;             // 閾値
    debounceTime?: number;          // デバウンス時間（ms）

    // ノート生成設定
    noteMapping?: NoteMapping[];    // モーション→ノートのマッピング
    velocityCurve?: VelocityCurve;  // ベロシティカーブ

    // 高度な設定
    gestureRecognition?: GestureConfig;  // ジェスチャー認識設定
    timingConfig?: TimingConfig;         // タイミング設定
    // ノートビルダー固有の追加プロパティ（例: drum_pattern.patterns など）
    [key: string]: any;
}

export interface GeneratorConfig {
    class: string;
    params: Record<string, any>;
    note_number_converter?: NoteNumberConverterConfig;
    // 基本的な音声生成設定
    instrumentType?: InstrumentType;     // 楽器タイプ
    volume?: number;                      // 音量（0.0 - 1.0）
    pan?: number;                         // パン（-1.0 - 1.0）

    // 音色設定
    timbre?: TimbreConfig;                // 音色設定
    effects?: EffectConfig[];             // エフェクト設定

    // 演奏設定
    articulation?: ArticulationConfig;    // アーティキュレーション設定
    dynamics?: DynamicsConfig;            // ダイナミクス設定
}

export interface NoteNumberConverterConfig {
    type: string;
    params?: Record<string, any>;
}

export interface SoundFontGeneratorConfig extends GeneratorConfig {
    class: "sf";
    params: {
        filename: string;
        preset_index: number;
        is_drum: boolean;
    }
}

// 楽器プリセットとトラック管理の型定義

/**
 * 楽器プリセット
 */
export interface InstrumentPreset {
    id: string;                          // 一意のID
    displayName: string;                 // 表示名
    icon: string;                        // アイコン識別子
    noteBuilderConfig: NoteBuilderConfig; // モーション検知設定
    generatorConfig: GeneratorConfig;     // 音声生成設定
    tags?: string[];                     // 検索・フィルタ用タグ
    category?: string;                   // 楽器カテゴリ
    description?: string;                // 説明
}

/**
 * トラック詳細情報
 */
export interface TrackDetail {
    displayName: string;                 // デバイス側での表示名
    icon: string;                        // アイコン識別子
    instrumentPresetId: string;          // 使用中の楽器プリセットID
}

/**
 * トラック選択状態
 */
export type CurrentTracksState = Map<string, number>; // deviceIdごとに選択中のトラック番号

// 補助的な型定義

export interface NoteMapping {
    motionType: MotionType;              // モーションタイプ
    note: number;                        // MIDIノート番号
    velocity: number;                    // ベロシティ
}

export interface VelocityCurve {
    type: 'linear' | 'exponential' | 'logarithmic';
    minVelocity: number;
    maxVelocity: number;
}

export interface GestureConfig {
    enabled: boolean;
    gestureTypes: string[];
    recognitionThreshold: number;
}

export interface TimingConfig {
    quantization: number;                // クオンタイゼーション
    swing: number;                       // スイング
    humanize: number;                    // ヒューマナイズ
}

export type InstrumentType =
    | 'piano' | 'guitar' | 'bass' | 'drums'
    | 'strings' | 'brass' | 'woodwind' | 'synth';

export interface TimbreConfig {
    attack: number;                      // アタック時間
    decay: number;                       // ディケイ時間
    sustain: number;                     // サステイン
    release: number;                     // リリース時間
}

export interface EffectConfig {
    type: EffectType;
    parameters: Record<string, number>;
    enabled: boolean;
}

export type EffectType =
    | 'reverb' | 'delay' | 'chorus' | 'flanger'
    | 'distortion' | 'compressor' | 'eq';

export interface ArticulationConfig {
    legato: boolean;                     // レガート
    staccato: boolean;                   // スタッカート
    vibrato: boolean;                    // ビブラート
}

export interface DynamicsConfig {
    velocitySensitivity: number;         // ベロシティ感度
    aftertouchSensitivity: number;       // アフタータッチ感度
}

export type MotionType =
    | 'tap' | 'swipe' | 'shake' | 'tilt'
    | 'rotation' | 'pressure' | 'proximity';

/**
 * 本体色設定
 */
export interface BodyColorConfig {
    body_color: string;  // デフォルト値 "#FFFFFF"
}

/**
 * LED色設定
 */
export interface LedColorConfig {
    base_led_color: string;  // デフォルト値 "#FF0000"
}
