import { InstrumentPreset } from '../types/player';

/**
 * 楽器プリセットの初期データ
 */
export const defaultInstrumentPresets: InstrumentPreset[] = [
    {
        id: 'piano-acoustic',
        displayName: 'Acoustic Piano',
        icon: 'piano',
        category: 'piano',
        tags: ['piano', 'acoustic', 'classical', 'keys'],
        description: 'クラシカルなアコースティックピアノ',
        noteBuilderConfig: {
            type: 'motion-to-note',
            sensitivity: 0.8,
            threshold: 0.3,
            debounceTime: 50,
            noteMapping: [
                { motionType: 'tap', note: 60, velocity: 0.8 },
                { motionType: 'swipe', note: 62, velocity: 0.6 },
                { motionType: 'shake', note: 64, velocity: 0.7 }
            ],
            velocityCurve: {
                type: 'exponential',
                minVelocity: 0.3,
                maxVelocity: 1.0
            },
            gestureRecognition: {
                enabled: true,
                gestureTypes: ['tap', 'swipe', 'shake'],
                recognitionThreshold: 0.5
            },
            timingConfig: {
                quantization: 16,
                swing: 0.0,
                humanize: 0.1
            }
        },
        generatorConfig: {
            class: 'piano',
            params: {},
            instrumentType: 'piano',
            volume: 0.8,
            pan: 0.0,
            timbre: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.7,
                release: 0.3
            },
            effects: [
                {
                    type: 'reverb',
                    parameters: { roomSize: 0.3, dampening: 0.5 },
                    enabled: true
                }
            ],
            articulation: {
                legato: true,
                staccato: false,
                vibrato: false
            },
            dynamics: {
                velocitySensitivity: 0.8,
                aftertouchSensitivity: 0.3
            }
        }
    },
    {
        id: 'guitar-electric',
        displayName: 'Electric Guitar',
        icon: 'guitar',
        category: 'guitar',
        tags: ['guitar', 'electric', 'rock', 'strings'],
        description: 'ロックなエレキギター',
        noteBuilderConfig: {
            type: 'motion-to-note',
            sensitivity: 0.7,
            threshold: 0.4,
            debounceTime: 30,
            noteMapping: [
                { motionType: 'tap', note: 64, velocity: 0.9 },
                { motionType: 'swipe', note: 67, velocity: 0.7 },
                { motionType: 'shake', note: 71, velocity: 0.8 }
            ],
            velocityCurve: {
                type: 'linear',
                minVelocity: 0.4,
                maxVelocity: 1.0
            },
            gestureRecognition: {
                enabled: true,
                gestureTypes: ['tap', 'swipe', 'shake', 'tilt'],
                recognitionThreshold: 0.6
            },
            timingConfig: {
                quantization: 8,
                swing: 0.2,
                humanize: 0.2
            }
        },
        generatorConfig: {
            class: 'guitar',
            params: {},
            instrumentType: 'guitar',
            volume: 0.9,
            pan: 0.0,
            timbre: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.6,
                release: 0.4
            },
            effects: [
                {
                    type: 'distortion',
                    parameters: { gain: 0.3, tone: 0.7 },
                    enabled: true
                },
                {
                    type: 'reverb',
                    parameters: { roomSize: 0.4, dampening: 0.3 },
                    enabled: true
                }
            ],
            articulation: {
                legato: false,
                staccato: true,
                vibrato: true
            },
            dynamics: {
                velocitySensitivity: 0.9,
                aftertouchSensitivity: 0.5
            }
        }
    },
    {
        id: 'drums-acoustic',
        displayName: 'Acoustic Drums',
        icon: 'drums',
        category: 'drums',
        tags: ['drums', 'acoustic', 'percussion', 'rhythm'],
        description: 'アコースティックドラムセット',
        noteBuilderConfig: {
            type: 'motion-to-note',
            sensitivity: 0.9,
            threshold: 0.2,
            debounceTime: 20,
            noteMapping: [
                { motionType: 'tap', note: 36, velocity: 0.8 }, // Bass Drum
                { motionType: 'swipe', note: 38, velocity: 0.7 }, // Snare
                { motionType: 'shake', note: 42, velocity: 0.6 }  // Closed Hi-Hat
            ],
            velocityCurve: {
                type: 'logarithmic',
                minVelocity: 0.2,
                maxVelocity: 1.0
            },
            gestureRecognition: {
                enabled: true,
                gestureTypes: ['tap', 'swipe', 'shake', 'pressure'],
                recognitionThreshold: 0.4
            },
            timingConfig: {
                quantization: 4,
                swing: 0.1,
                humanize: 0.15
            }
        },
        generatorConfig: {
            class: 'drums',
            params: {},
            instrumentType: 'drums',
            volume: 0.85,
            pan: 0.0,
            timbre: {
                attack: 0.001,
                decay: 0.8,
                sustain: 0.2,
                release: 0.1
            },
            effects: [
                {
                    type: 'compressor',
                    parameters: { threshold: -20, ratio: 4 },
                    enabled: true
                }
            ],
            articulation: {
                legato: false,
                staccato: true,
                vibrato: false
            },
            dynamics: {
                velocitySensitivity: 0.95,
                aftertouchSensitivity: 0.1
            }
        }
    },
    {
        id: 'synth-lead',
        displayName: 'Lead Synth',
        icon: 'synth',
        category: 'synth',
        tags: ['synth', 'lead', 'electronic', 'melody'],
        description: 'リードシンセサイザー',
        noteBuilderConfig: {
            type: 'motion-to-note',
            sensitivity: 0.6,
            threshold: 0.5,
            debounceTime: 40,
            noteMapping: [
                { motionType: 'tap', note: 72, velocity: 0.7 },
                { motionType: 'swipe', note: 74, velocity: 0.6 },
                { motionType: 'tilt', note: 76, velocity: 0.8 }
            ],
            velocityCurve: {
                type: 'exponential',
                minVelocity: 0.5,
                maxVelocity: 1.0
            },
            gestureRecognition: {
                enabled: true,
                gestureTypes: ['tap', 'swipe', 'tilt', 'rotation'],
                recognitionThreshold: 0.7
            },
            timingConfig: {
                quantization: 32,
                swing: 0.0,
                humanize: 0.05
            }
        },
        generatorConfig: {
            class: 'synth',
            params: {},
            instrumentType: 'synth',
            volume: 0.75,
            pan: 0.0,
            timbre: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.8,
                release: 0.5
            },
            effects: [
                {
                    type: 'chorus',
                    parameters: { rate: 0.8, depth: 0.6 },
                    enabled: true
                },
                {
                    type: 'delay',
                    parameters: { time: 0.3, feedback: 0.4 },
                    enabled: true
                }
            ],
            articulation: {
                legato: true,
                staccato: false,
                vibrato: true
            },
            dynamics: {
                velocitySensitivity: 0.6,
                aftertouchSensitivity: 0.8
            }
        }
    }
];

/**
 * プリセットIDからプリセットを取得
 */
export function getPresetById(id: string): InstrumentPreset | undefined {
    return defaultInstrumentPresets.find(preset => preset.id === id);
}

/**
 * タグでプリセットを検索
 */
export function getPresetsByTag(tag: string): InstrumentPreset[] {
    return defaultInstrumentPresets.filter(preset =>
        preset.tags?.includes(tag)
    );
}

/**
 * カテゴリでプリセットを検索
 */
export function getPresetsByCategory(category: string): InstrumentPreset[] {
    return defaultInstrumentPresets.filter(preset =>
        preset.category === category
    );
}

/**
 * プリセット名で検索
 */
export function searchPresets(query: string): InstrumentPreset[] {
    const lowerQuery = query.toLowerCase();
    return defaultInstrumentPresets.filter(preset =>
        preset.displayName.toLowerCase().includes(lowerQuery) ||
        preset.description?.toLowerCase().includes(lowerQuery) ||
        preset.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}
