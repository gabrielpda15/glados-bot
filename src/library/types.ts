export namespace Dictionary {

    export function create<T>(): Dictionary<T> {
        return new DictionaryIterator<T>() as any;
    }

    export class DictionaryIterator<T> {

        constructor() { }

        * [Symbol.iterator]() {
            for (let key in this) {
                yield { key: key, value: this[key] }
            }
        }

        values(): T[] {
            return Object.values(this);
        }

        keys(): string[] {
            return Object.keys(this);
        }

        forEach(callbackfn: (value: this[Extract<keyof this, string>], key: Extract<keyof this, string>, dictionary: this) => void, thisArg?: any): void {
            for (let tuple of this) {
                callbackfn(tuple.value, tuple.key, this);
            }
        }

        clear(): void {
            const backup = [];
            for (let tuple of this) {
                backup.push(tuple);
                if (!this.delete(tuple.key)) {
                    backup.forEach(x => this.set(x.key, x.value));
                    return;
                }
            }
        }

        delete(key: Extract<keyof this, string>): boolean {
            try {
                delete (<any>this)[key];
                return true;
            } catch {
                return false;
            }            
        }

        get(key: Extract<keyof this, string>): this[Extract<keyof this, string>] | undefined {
            return (<any>this)[key];
        }

        has(key: Extract<keyof this, string>): boolean {
            return this.keys().includes(key);
        }

        set(key: Extract<keyof this, string>, value: this[Extract<keyof this, string>]): this {
            (<any>this)[key] = value;
            return this;
        }

        length(): number {
            return this.keys().length;
        }

    }

}

export type Dictionary<T> = { [key: string]: T } & Dictionary.DictionaryIterator<T>;