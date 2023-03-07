export class Migration {
    _migrationCommand;
    constructor(migrationCommand) {
        this._migrationCommand = migrationCommand;
    }
    async up(query) {
        if (this._migrationCommand.getUpSql) {
            await query(this._migrationCommand.getUpSql());
        }
        else {
            await query(this._migrationCommand.up.query, this._migrationCommand.up.binds);
        }
    }
    async down(query) {
        if (this._migrationCommand.getDownSql) {
            await query(this._migrationCommand.getDownSql());
        }
        else {
            await query(this._migrationCommand.down.query, this._migrationCommand.down.binds);
        }
    }
}
