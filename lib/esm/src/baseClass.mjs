import chalk from "chalk";
import { loadCfgFile } from "./helpers";
export default class MigrationBase {
    _databaseType;
    _dir = './migrations';
    _query = (query) => Promise.resolve([query]);
    async loadCfgFile() {
        try {
            const cfg = await loadCfgFile();
            this._query = cfg.query;
            this._databaseType = cfg.database.strToLower();
            if (cfg.dir) {
                this._dir = cfg.dir;
            }
        }
        catch (err) {
            this.error(err.message);
        }
    }
    error(msg) {
        console.log(chalk.red(msg));
        process.exit();
    }
}
