export class Migration {
    _migrationCommand;
    constructor(migrationCommand) {
        this._migrationCommand = migrationCommand;
    }
    async up(query) {
        await query(this._migrationCommand.getUpSql());
    }
    async down(query) {
        await query(this._migrationCommand.getDownSql());
    }
}
