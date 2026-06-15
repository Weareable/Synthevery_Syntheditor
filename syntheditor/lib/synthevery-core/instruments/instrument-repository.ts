import { InstrumentPreset, NoteBuilderConfig, GeneratorConfig } from "../types/player";
import { builtinPresets } from "./builtin";
import EventEmitter from 'eventemitter3'

export class InstrumentRepository {
    private cache: Map<string, InstrumentPreset> = new Map();
    public eventEmitter: EventEmitter = new EventEmitter();

    constructor() {
        this.load();
    }

    private load() {
        // ローカルストレージは使用せず、builtin.ts のみをロード
        this.cache.clear();
        for (const p of builtinPresets) {
            if (p && p.id && p.noteBuilderConfig && p.generatorConfig) {
                this.cache.set(p.id, p);
            }
        }
        this.eventEmitter.emit('change');
    }

    private save() {
        // 一時的に永続化を無効化
        return;
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
        this.eventEmitter.emit('change');
    }

    update(id: string, patch: Partial<InstrumentPreset>): void {
        const cur = this.cache.get(id);
        if (!cur) throw new Error("not found");
        const next: InstrumentPreset = { ...cur, ...patch } as InstrumentPreset;
        this.cache.set(id, next);
        this.save();
        this.eventEmitter.emit('change');
    }

    remove(id: string): void {
        this.cache.delete(id);
        this.save();
        this.eventEmitter.emit('change');
    }

    import(list: InstrumentPreset[], replace = false): void {
        // ストレージ無効化中は import もキャッシュのみ更新
        if (replace) this.cache.clear();
        for (const p of list) {
            if (p && p.id && p.noteBuilderConfig && p.generatorConfig) {
                this.cache.set(p.id, p);
            }
        }
        this.save();
        this.eventEmitter.emit('change');
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


