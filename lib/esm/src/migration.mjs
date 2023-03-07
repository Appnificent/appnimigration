import { MigrationCommand } from './migrationSqlBuilder.mjs';
export class Migration {
    _migrationCommand;
    constructor(migrationCommand) {
        this._migrationCommand = migrationCommand;
    }
    async up(query) {
        if (this._migrationCommand instanceof MigrationCommand) {
            await query(this._migrationCommand.getUpSql());
        }
        else {
            await query(this._migrationCommand.up.query, this._migrationCommand.up.binds);
        }
    }
    async down(query) {
        if (this._migrationCommand instanceof MigrationCommand) {
            await query(this._migrationCommand.getDownSql());
        }
        else {
            await query(this._migrationCommand.down.query, this._migrationCommand.down.binds);
        }
    }
}
