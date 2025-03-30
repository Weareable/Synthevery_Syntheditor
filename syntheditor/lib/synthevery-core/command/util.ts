export class SetQueue<T> {
    private items: T[] = [];
    private set: Set<string> = new Set<string>();

    constructor() {

    }
    push(item: T): boolean {
        const key = JSON.stringify(item);
        if (this.set.has(key)) {
            return false;
        }
        this.items.push(item);
        this.set.add(key);
        return true;
    }
    pop(): T | undefined {
        const item = this.items.shift();
        if (item) {
            this.set.delete(JSON.stringify(item));
        }
        return item;
    }
    clear(): void {
        this.items = [];
        this.set.clear();
    }

    empty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }
}