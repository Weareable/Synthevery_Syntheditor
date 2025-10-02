import { InstrumentPreset } from "../types/player";

// Minimal examples referencing settings.json patterns
export const builtinPresets: InstrumentPreset[] = [
    {
        id: "drum_pattern_1",
        displayName: "Drum Pattern",
        icon: "drum",
        noteBuilderConfig: {
            type: "drum_pattern"
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
        id: "yaw_drum_1",
        displayName: "Yaw Drum",
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


