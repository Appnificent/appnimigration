import MigrationBase from "./baseClass";
export declare type query = (query: string, bind?: any) => Promise<Array<any>>;
export declare class MigrationManager extends MigrationBase {
    private get _migrationQueries();
    init(): Promise<void>;
    migrate(direction: 'up' | 'down'): Promise<void>;
    migrateUp(migrations: string[], init?: boolean): Promise<void>;
    migrateDown(): Promise<void>;
    generate(name: string, template?: string, init?: boolean): Promise<void>;
    private generateName;
    private dateAddNull;
}
//# sourceMappingURL=migrationManager.d.ts.map