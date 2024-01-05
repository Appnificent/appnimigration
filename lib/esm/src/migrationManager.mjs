import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import slugify from 'slugify';
import chalk from 'chalk';
import { pathToFileURL } from "url";
import MigrationBase from "./baseClass";
import migrationManagerQueries from "./migrationManagerQueries";
const packageDirectory = resolve('node_modules/@appnificent/appnimigration');
export class MigrationManager extends MigrationBase {
    get _migrationQueries() {
        return migrationManagerQueries[this._databaseType || 'mysql'];
    }
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
            const existingMigrationsRes = await this._query(this._migrationQueries.existingMigrationsQuery);
            migratedFiles = existingMigrationsRes.map(val => val.Name);
        }
        for (let migrationFile of migrations) {
            if (migratedFiles.includes(migrationFile))
                continue;
            const migration = (await import(pathToFileURL(join(resolve(this._dir), migrationFile)).toString())).default;
            await migration.up(this._query);
            await this._query(this._migrationQueries.insertMigrationQuery, { name: migrationFile });
        }
        console.log(chalk.green('Successfully migrated!'));
        process.exit();
    }
    async migrateDown() {
        const lastMigrationDateRes = await this._query(this._migrationQueries.lastMigrationDateQuery);
        const latestMigrations = await this._query(this._migrationQueries.latestMigrationsQuery, { lastDateTime: lastMigrationDateRes[0].DateTime });
        if (latestMigrations[0].Name !== 'init.ts') {
            for (let migration of latestMigrations) {
                const migrationModel = (await import(pathToFileURL(join(resolve(this._dir), migration.Name)).toString())).default;
                await migrationModel.down(this._query);
                await this._query(this._migrationQueries.deleteMigrationQuery, { name: migration.Name });
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
}
