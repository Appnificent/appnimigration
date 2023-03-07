import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import slugify from 'slugify';
import chalk from 'chalk';
import { pathToFileURL } from "url";
const packageDirectory = resolve('node_modules/@appnificent/appnimigration');
export class MigrationManager {
    _dir = './migrations';
    _query = (query) => Promise.resolve([query]);
    async init() {
        await this.loadCfgFile();
        if (!existsSync(resolve(this._dir))) {
            mkdirSync(resolve(this._dir));
        }
        else {
            this.error('Cannot init migrations, migration folder already exists!');
        }
        this.generate('init', 'init-migration.js', true);
        const migrations = readdirSync(resolve(this._dir));
        this.migrateUp(migrations, true);
    }
    async migrate(direction) {
        await this.loadCfgFile();
        if (!existsSync(resolve(this._dir))) {
            this.error('No folder with migrations found!');
        }
        if (direction === 'up') {
            const migrations = readdirSync(resolve(this._dir));
            this.migrateUp(migrations);
        }
        else {
            this.migrateDown();
        }
    }
    async migrateUp(migrations, init = false) {
        let migratedFiles = [];
        if (!init) {
            const existingMigrationsRes = await this._query("SELECT * FROM __AppMigrations");
            migratedFiles = existingMigrationsRes.map(val => val.Name);
        }
        for (let migrationFile of migrations) {
            if (migratedFiles.includes(migrationFile))
                continue;
            const migration = (await import(pathToFileURL(join(resolve(this._dir), migrationFile)).toString())).default;
            await migration.up(this._query);
            await this._query('INSERT INTO __AppMigrations([Name], [DateTime]) VALUES(@name, GETDATE())', { name: migrationFile });
        }
        console.log(chalk.green('Successfully migrated!'));
        process.exit();
    }
    async migrateDown() {
        const lastMigrationDateRes = await this._query('SELECT TOP 1 [DateTime] FROM __AppMigrations ORDER BY [DateTime] DESC');
        const latestMigrations = await this._query('SELECT * FROM __AppMigrations WHERE [DateTime] = @lastDateTime', { lastDateTime: lastMigrationDateRes[0].DateTime });
        if (latestMigrations[0].Name !== 'init.ts') {
            for (let migration of latestMigrations) {
                const migrationModel = (await import(pathToFileURL(join(resolve(this._dir), migration.Name)).toString())).default;
                await migrationModel.down(this._query);
                await this._query('DELETE FROM __AppMigrations WHERE [Name] = @name', { name: migration.Name });
            }
        }
        console.log(chalk.green('Database was successfully migrated down!'));
        process.exit();
    }
    async generate(name, template = 'migration-template.js', init = false) {
        await this.loadCfgFile();
        let fileName = this.generateName(name);
        if (init) {
            fileName = 'init';
        }
        const templateFull = readFileSync(join(packageDirectory, '/lib/', template), { encoding: 'utf8' });
        writeFileSync(join(resolve(this._dir), fileName + '.mjs'), templateFull);
    }
    generateName(name) {
        const now = new Date();
        return `${now.getFullYear()}_${this.dateAddNull(now.getMonth() + 1)}_${this.dateAddNull(now.getDate())}_${this.dateAddNull(now.getHours())}_${this.dateAddNull(now.getMinutes())}_${this.dateAddNull(now.getSeconds())}_${slugify(name)}`;
    }
    dateAddNull(val) {
        return ('0' + val).slice(-2);
    }
    async loadCfgFile() {
        if (!existsSync(join(process.cwd(), 'appnimigration.config.js'))) {
            this.error('No configuration file found! Make sure that appnimigration.config.js file exists in the root of the project!');
        }
        const cfg = await import(pathToFileURL(join(process.cwd(), 'appnimigration.config.js')).toString());
        if (!cfg) {
            this.error('Config file has not default export!');
        }
        if (!cfg.query) {
            this.error('Config file does not include query function!');
        }
        this._query = cfg.query;
        if (cfg.dir) {
            this._dir = cfg.dir;
        }
    }
    error(msg) {
        console.log(chalk.red(msg));
        process.exit();
    }
}
