import { query } from './migrationManager';
export default class MigrationBase {
    protected _databaseType?: "mysql" | "mssql";
    protected _dir: string;
    protected _query: query;
    protected loadCfgFile(): Promise<void>;
    protected error(msg: string): void;
}
//# sourceMappingURL=baseClass.d.ts.map