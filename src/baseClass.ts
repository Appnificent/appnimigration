import chalk from "chalk";
import { loadCfgFile } from "./helpers";
import { query } from './migrationManager';

export default class MigrationBase {
  protected _databaseType?: "mysql" | "mssql";
  protected _dir: string = './migrations';
  protected _query: query = (query) => Promise.resolve([query]);

  protected async loadCfgFile() {
    try {
      const cfg = await loadCfgFile();
      this._query = cfg.query;
      this._databaseType = cfg.database.strToLower();
      if(cfg.dir) {
        this._dir = cfg.dir;
      }
    } catch(err: any) {
      this.error(err.message);
    }
  }

  protected error(msg: string) {
    console.log(chalk.red(msg));
    process.exit();
  }
}