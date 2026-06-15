import { InstrumentPreset } from "../types/player";

// Minimal examples referencing settings.json patterns
export const builtinPresets: InstrumentPreset[] = [
    {
        id: "drum_pattern_1",
        displayName: "Drum Pattern",
        icon: "drum",
        noteBuilderConfig: {
            type: "drum_pattern",
            patterns: [
                {
                    loop_length_tick: 480,
                    notes: [
                        { tick: 0, note_num: 42, velocity: 100 },
                        { tick: 120, note_num: 42, velocity: 80 },
                        { tick: 240, note_num: 46, velocity: 100 },
                        { tick: 360, note_num: 42, velocity: 90 }
                    ]
                },
                {
                    loop_length_tick: 960,
                    notes: [
                        { tick: 0, note_num: 36, velocity: 100 },
                        { tick: 120, note_num: 42, velocity: 100 },
                        { tick: 240, note_num: 36, velocity: 80 },
                        { tick: 360, note_num: 42, velocity: 90 },
                        { tick: 480, note_num: 36, velocity: 100 },
                        { tick: 480, note_num: 40, velocity: 100 },
                        { tick: 480, note_num: 42, velocity: 100 },
                        { tick: 600, note_num: 42, velocity: 100 },
                        { tick: 720, note_num: 36, velocity: 100 },
                        { tick: 840, note_num: 42, velocity: 100 }
                    ]
                }
            ]
        },
        generatorConfig: {
            class: "sf",
            params: { filename: "/ukg_drum.sf2", preset_index: 0, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["drum"],
        category: "drums"
    },
    {
        id: "piano_1",
        displayName: "Piano",
        icon: "piano",
        noteBuilderConfig: { type: "piano" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/hl1mgm.sf2", preset_index: 0, is_drum: false },
            note_number_converter: { type: "chord_sequence" }
        },
        tags: ["keys"],
        category: "keys"
    },
    {
        id: "arpeggio_1",
        displayName: "Arpeggio",
        icon: "arpeggio",
        noteBuilderConfig: { type: "arpeggio" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/hl1mgm.sf2", preset_index: 81, is_drum: false },
            note_number_converter: { type: "scale_sequence" }
        },
        tags: ["arp"],
        category: "synth"
    },
    {
        id: "rock_drum_1",
        displayName: "Rock Drum",
        icon: "drum",
        noteBuilderConfig: { type: "trap_drum" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["drum"],
        category: "drums"
    },
    {
        id: "bongo_1",
        displayName: "Bongo",
        icon: "bongo",
        noteBuilderConfig: { type: "bongo" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/rock_drum.sf2", preset_index: 9, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["percussion"],
        category: "drums"
    },
    {
        id: "trap_drum_1",
        displayName: "Trap Drum",
        icon: "trap_drum",
        noteBuilderConfig: { type: "trap_drum" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/hl1mgm.sf2", preset_index: 128, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["drum"],
        category: "drums"
    },
    {
        id: "strum_1",
        displayName: "Strum",
        icon: "guitar",
        noteBuilderConfig: { type: "strum" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/hl1mgm.sf2", preset_index: 38, is_drum: false },
            note_number_converter: { type: "scale_sequence" }
        },
        tags: ["guitar"],
        category: "strings"
    },
    {
        id: "yaw_drum_1",
        displayName: "Yaw Drum",
        icon: "yaw_drum",
        noteBuilderConfig: { type: "yaw_drum" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/hl1mgm.sf2", preset_index: 128, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["motion"],
        category: "drums"
    },
    {
        id: "yaw_percussions_1",
        displayName: "Yaw Percussions",
        icon: "yaw_drum",
        noteBuilderConfig: { type: "yaw_drum" },
        generatorConfig: {
            class: "sf",
            params: { filename: "/percussions.sf2", preset_index: 0, is_drum: true },
            note_number_converter: { type: "empty" }
        },
        tags: ["motion"],
        category: "drums"
    }
];


