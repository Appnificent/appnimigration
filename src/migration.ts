import { query } from './migrationManager';
import { MigrationCommand } from './migrationSqlBuilder';
export class Migration {
  private _migrationCommand: MigrationCommand;

  constructor(migrationCommand: MigrationCommand) {
    this._migrationCommand = migrationCommand;
  }

  async up(query: query) {
    await query(this._migrationCommand.getUpSql())
  }

  async down(query: query) {
    await query(this._migrationCommand.getDownSql());
  }
}