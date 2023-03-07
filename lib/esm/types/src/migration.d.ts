import { query } from './migrationManager';
import { MigrationCommand } from './migrationSqlBuilder.js';
interface IMigrationQuery {
    up: {
        query: string;
        binds?: any[];
    };
    down: {
        query: string;
        binds?: any[];
    };
}
export declare class Migration {
    private _migrationCommand;
    constructor(migrationCommand: MigrationCommand | IMigrationQuery);
    up(query: query): Promise<void>;
    down(query: query): Promise<void>;
}
export {};
//# sourceMappingURL=migration.d.ts.map