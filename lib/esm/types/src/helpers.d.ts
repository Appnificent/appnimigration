import { query } from "./migrationManager";
export interface Config {
    _databaseType?: "mysql" | "mssql";
    _dir?: string;
    _query: query;
}
export declare function loadCfgFile(): Promise<any>;
//# sourceMappingURL=helpers.d.ts.map