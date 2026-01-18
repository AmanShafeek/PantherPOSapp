export class AliasService {
    private readonly STORAGE_KEY = 'pos_ai_aliases';
    private aliases: Record<string, string> = {};

    constructor() {
        this.load();
    }

    private load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.aliases = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load aliases', e);
        }
    }

    public getAliases(): Record<string, string> {
        return { ...this.aliases };
    }

    public addAlias(alias: string, target: string) {
        this.aliases[alias.toLowerCase()] = target.toLowerCase();
        this.save();
    }

    public removeAlias(alias: string) {
        delete this.aliases[alias.toLowerCase()];
        this.save();
    }

    public resolve(input: string): string {
        const lower = input.toLowerCase();
        return this.aliases[lower] || lower;
    }

    private save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.aliases));
        } catch (e) {
            console.error('Failed to save aliases', e);
        }
    }
}

export const aliasService = new AliasService();
