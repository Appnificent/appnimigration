import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import slugify from 'slugify';
import chalk from 'chalk';
export class MigrationManager {
    _dir = './migrations';
    _query = (query) => Promise.resolve([query]);
    constructor() {
        this.loadCfgFile();
    }
    init() {
        if (!existsSync(resolve(this._dir))) {
            mkdirSync(resolve(this._dir));
        }
        else {
            this.error('Cannot init migrations, migration folder already exists!');
        }
        this.generate('init', 'init-migration.ts', true);
        const migrations = readdirSync(resolve(this._dir));
        this.migrateUp(migrations, true);
    }
    migrate(direction) {
        if (!existsSync(resolve(this._dir))) {
            this.error('No folder with migrations found!');
        }
        const migrations = readdirSync(resolve(this._dir));
        if (direction === 'up') {
            this.migrateUp(migrations);
        }
        else {
            this.migrateDown(migrations);
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
            const migration = require(join(resolve(this._dir), migrationFile)).default;
            await migration.up(this._query);
            await this._query('INSERT INTO __AppMigrations([Name], [DateTime]) VALUES(@name, GETDATE())', { name: migrationFile });
        }
        console.log(chalk.green('Successfully migrated!'));
        process.exit();
    }
    async migrateDown(migrations) {
        const lastMigrationDateRes = await this._query('SELECT TOP 1 [DateTime] FROM __AppMigrations ORDER BY [DateTime] DESC');
        const latestMigrations = await this._query('SELECT * FROM __AppMigrations WHERE [DateTime] = @lastDateTime', { lastDateTime: lastMigrationDateRes[0].DateTime });
        if (latestMigrations[0].Name !== 'init.ts') {
            for (let migration of latestMigrations) {
                const migrationModel = require(join(resolve(this._dir), migration.Name)).default;
                await migrationModel.down(this._query);
                await this._query('DELETE FROM __AppMigrations WHERE [Name] = @name', { name: migration.Name });
            }
        }
        console.log(chalk.green('Database was successfully migrated down!'));
        process.exit();
    }
    generate(name, template = 'migration-template.ts', init = false) {
        let fileName = this.generateName(name);
        if (init) {
            fileName = 'init';
        }
        const templateFull = readFileSync(join(__dirname, template), { encoding: 'utf8' });
        writeFileSync(join(resolve(this._dir), fileName + '.ts'), templateFull);
    }
    generateName(name) {
        const now = new Date();
        return `${now.getFullYear()}_${this.dateAddNull(now.getMonth() + 1)}_${this.dateAddNull(now.getDate())}_${this.dateAddNull(now.getHours())}_${this.dateAddNull(now.getMinutes())}_${this.dateAddNull(now.getSeconds())}_${slugify(name)}`;
    }
    dateAddNull(val) {
        return ('0' + val).slice(-2);
    }
    loadCfgFile() {
        if (!existsSync(join(process.cwd(), 'appnimigration.config.js'))) {
            this.error('No configuration file found! Make sure that appnimigration.config.js file exists in the root of the project!');
        }
        const cfg = require(join(process.cwd(), 'appnimigration.config.js'));
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
