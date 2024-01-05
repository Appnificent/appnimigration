import { existsSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
let cfgCache;
export async function loadCfgFile() {
    if (cfgCache)
        return cfgCache;
    if (!existsSync(join(process.cwd(), 'appnimigration.config.mjs'))) {
        throw new Error('No configuration file found! Make sure that appnimigration.config.mjs file exists in the root of the project!');
    }
    const cfg = await import(pathToFileURL(join(process.cwd(), 'appnimigration.config.mjs')).toString());
    if (!cfg) {
        throw new Error('Config file has not default export!');
    }
    if (!cfg.query) {
        throw new Error('Config file does not include query function!');
    }
    if (!cfg.database) {
        throw new Error('Config file does not include database type!');
    }
    cfgCache = cfg;
    return cfg;
}
