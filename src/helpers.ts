import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { query } from "./migrationManager";

export interface Config {
  _databaseType?: "mysql" | "mssql";
  _dir?: string;
  _query: query;
}

let cfgCache: Config;

export async function loadCfgFile() {
  if(cfgCache) return cfgCache;
  if(!existsSync(join(process.cwd(), 'appnimigration.config.js'))) {
    throw new Error('No configuration file found! Make sure that appnimigration.config.js file exists in the root of the project!');
  }

  const cfgImp = await import(pathToFileURL(join(process.cwd(), 'appnimigration.config.js')).toString());
  const cfg = cfgImp.default;
  if(!cfg) {
    throw new Error('Config file has not default export!');
  }

  if(!cfg.query) {
    throw new Error('Config file does not include query function!');
  }

  if(!cfg.database) {
    throw new Error('Config file does not include database type!');
  }

  cfgCache = cfg;

  return cfg;
}