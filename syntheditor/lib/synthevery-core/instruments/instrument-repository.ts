import { InstrumentPreset, NoteBuilderConfig, GeneratorConfig } from "../types/player";

const STORAGE_KEY = "synthevery.instrumentPresets.v1";

export class InstrumentRepository {
    private cache: Map<string, InstrumentPreset> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
            if (!raw) return;
            const list: InstrumentPreset[] = JSON.parse(raw);
            this.cache.clear();
            for (const p of list) {
                if (p && p.id && p.noteBuilderConfig && p.generatorConfig) {
                    this.cache.set(p.id, p);
                }
            }
        } catch { }
    }

    private save() {
        try {
            const list = Array.from(this.cache.values());
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            }
        } catch { }
    }

    list(): InstrumentPreset[] {
        return Array.from(this.cache.values());
    }

    get(id: string): InstrumentPreset | undefined {
        return this.cache.get(id);
    }

    add(preset: InstrumentPreset): void {
        if (!preset || !preset.id) throw new Error("invalid preset");
        this.cache.set(preset.id, preset);
        this.save();
    }

    update(id: string, patch: Partial<InstrumentPreset>): void {
        const cur = this.cache.get(id);
        if (!cur) throw new Error("not found");
        const next: InstrumentPreset = { ...cur, ...patch } as InstrumentPreset;
        this.cache.set(id, next);
        this.save();
    }

    remove(id: string): void {
        this.cache.delete(id);
        this.save();
    }

    import(list: InstrumentPreset[], replace = false): void {
        if (replace) this.cache.clear();
        for (const p of list) {
            if (p && p.id && p.noteBuilderConfig && p.generatorConfig) {
                this.cache.set(p.id, p);
            }
        }
        this.save();
    }

    export(): InstrumentPreset[] {
        return this.list();
    }

    search(keyword: string): InstrumentPreset[] {
        const q = keyword.trim().toLowerCase();
        if (!q) return this.list();
        return this.list().filter(p =>
            p.displayName.toLowerCase().includes(q) ||
            (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
            (p.category || '').toLowerCase().includes(q)
        );
    }
}


