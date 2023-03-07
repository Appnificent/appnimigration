export declare type query = (query: string, bind?: any) => Promise<Array<any>>;
export declare class MigrationManager {
    private _dir;
    private _query;
    init(): Promise<void>;
    migrate(direction: 'up' | 'down'): Promise<void>;
    migrateUp(migrations: string[], init?: boolean): Promise<void>;
    migrateDown(): Promise<void>;
    generate(name: string, template?: string, init?: boolean): Promise<void>;
    private generateName;
    private dateAddNull;
    private loadCfgFile;
    private error;
}
//# sourceMappingURL=migrationManager.d.ts.map