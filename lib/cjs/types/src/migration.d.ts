import { query } from './migrationManager';
import { MigrationCommand } from './migrationSqlBuilder';
export declare class Migration {
    private _migrationCommand;
    constructor(migrationCommand: MigrationCommand);
    up(query: query): Promise<void>;
    down(query: query): Promise<void>;
}
//# sourceMappingURL=migration.d.ts.map