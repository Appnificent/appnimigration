import { query } from './migrationManager';
import { MigrationCommand } from './migrationSqlBuilder.js';

interface IMigrationQuery {
  up: {
    query: string;
    binds?: any[];
  },
  down: {
    query: string;
    binds?: any[];
  }
}
export class Migration {
  private _migrationCommand: MigrationCommand | IMigrationQuery;

  constructor(migrationCommand: MigrationCommand | IMigrationQuery) {
    this._migrationCommand = migrationCommand;
  }

  async up(query: query) {
    if(this._migrationCommand instanceof MigrationCommand) {
      await query(this._migrationCommand.getUpSql())
    } else {
      await query(this._migrationCommand.up.query, this._migrationCommand.up.binds);
    }
  }

  async down(query: query) {
    if(this._migrationCommand instanceof MigrationCommand) {
      await query(this._migrationCommand.getDownSql());
    } else {
      await query(this._migrationCommand.down.query, this._migrationCommand.down.binds);
    }
  }
}