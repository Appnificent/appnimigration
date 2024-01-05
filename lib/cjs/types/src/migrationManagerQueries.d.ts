export interface MigrationQueries {
    insertMigrationQuery: string;
    lastMigrationDateQuery: string;
    latestMigrationsQuery: string;
    deleteMigrationQuery: string;
    existingMigrationsQuery: string;
}
export interface MigrationManagerQueries {
    mssql: MigrationQueries;
    mysql: MigrationQueries;
}
declare const migrationManagerQueries: MigrationManagerQueries;
export default migrationManagerQueries;
//# sourceMappingURL=migrationManagerQueries.d.ts.map