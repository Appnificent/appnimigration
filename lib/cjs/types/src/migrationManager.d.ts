export declare type query = (query: string, bind?: any) => Promise<Array<any>>;
export declare class MigrationManager {
    private _dir;
    private _query;
    constructor();
    init(): void;
    migrate(direction: 'up' | 'down'): void;
    migrateUp(migrations: string[], init?: boolean): Promise<void>;
    migrateDown(migrations: string[]): Promise<void>;
    generate(name: string, template?: string, init?: boolean): void;
    private generateName;
    private dateAddNull;
    private loadCfgFile;
    private error;
}
//# sourceMappingURL=migrationManager.d.ts.map