export declare class ColumnDefinition {
    private _name?;
    private _columnType?;
    private _nullable;
    private _default?;
    private _primary;
    private _unique;
    private _references?;
    private _migrationCommand;
    constructor(name: string, migrationCommand: MigrationCommand);
    get nullable(): ColumnDefinition & MigrationCommand;
    get primary(): ColumnDefinition & MigrationCommand;
    get unique(): ColumnDefinition & MigrationCommand;
    get uuid(): ColumnDefinition & MigrationCommand;
    get bit(): ColumnDefinition & MigrationCommand;
    get int(): ColumnDefinition & MigrationCommand;
    get datetime2(): ColumnDefinition & MigrationCommand;
    get migrationCommand(): MigrationCommand;
    default(val: string): ColumnDefinition & MigrationCommand;
    type(val: string): ColumnDefinition & MigrationCommand;
    addReference(val: string): ColumnDefinition & MigrationCommand;
    generate(): string;
    getProxy(): ColumnDefinition & MigrationCommand;
    getName(): string | undefined;
}
export declare class KeyDefinition {
    private _name;
    private _keyType?;
    private _cols;
    private _references?;
    private _migrationCommand;
    constructor(name: string, migrationCommand: MigrationCommand);
    get unique(): KeyDefinition & MigrationCommand;
    get primary(): KeyDefinition & MigrationCommand;
    get migrationCommand(): MigrationCommand;
    foreign(cols: string[], references: string): KeyDefinition & MigrationCommand;
    cols(...cols: string[]): KeyDefinition & MigrationCommand;
    generate(): string;
    getName(): string;
    getProxy(): KeyDefinition & MigrationCommand;
}
export declare class MigrationCommand {
    private _columnDefinitions;
    private _type;
    private _table;
    private _keys;
    constructor(type: 'create' | 'createNotExists' | 'alter', table: string);
    getUpSql(): string;
    getDownSql(): string;
    addColumn(name: string): ColumnDefinition & MigrationCommand;
    addColumnRaw(definition: {
        up: string;
        down: string;
    }): MigrationCommand;
    addKey(name: string): KeyDefinition & MigrationCommand;
    addKeyRaw(definition: {
        up: string;
        down: string;
    }): MigrationCommand;
    private _getCreateCols;
    private _getCreateSql;
    private _getCreateNotExistsSql;
    private _getAlterSql;
    private _getAlterAddColumnSql;
    private _getAlterAddConstraintSql;
    private _getDropSql;
    private _getUnalterSql;
    private _getDropColumnSql;
    private _getDropKeySql;
    private _createKeysSql;
    private _dropKeysSql;
}
export declare function createTableIfNotExist(name: string): MigrationCommand;
export declare function createTable(name: string): MigrationCommand;
export declare function alterTable(table: string): MigrationCommand;
export declare function createMigration(type: 'create' | 'createNotExists' | 'alter', table: string): MigrationCommand;
//# sourceMappingURL=migrationSqlBuilder.d.ts.map