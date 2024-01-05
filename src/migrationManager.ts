import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import slugify from 'slugify';
import chalk from 'chalk';
import { pathToFileURL } from "url";
import MigrationBase from "./baseClass";
import migrationManagerQueries, { MigrationQueries } from "./migrationManagerQueries";

export type query = (query: string, bind?: any) => Promise<Array<any>>;

const packageDirectory = resolve('node_modules/@appnificent/appnimigration');

export class MigrationManager extends MigrationBase {
  private _database;

  get databaseType(): string {
    return this._database;
  }

  private get _migrationQueries(): MigrationQueries {
    return migrationManagerQueries[this._databaseType];
  }

  async init() {
    await this.loadCfgFile();
    if(!existsSync(resolve(this._dir))) {
      mkdirSync(resolve(this._dir));
    } else {
      this.error('Cannot init migrations, migration folder already exists!');
    }
    this.generate('init', 'init-migration.js', true);
    const migrations = readdirSync(resolve(this._dir));
    this.migrateUp(migrations, true);
  }

  async migrate(direction: 'up' | 'down') {
    await this.loadCfgFile();
    if(!existsSync(resolve(this._dir))) {
      this.error('No folder with migrations found!');
    }
    if(direction === 'up') {
      const migrations = readdirSync(resolve(this._dir));
      this.migrateUp(migrations);
    } else {
      this.migrateDown();
    }
  }

  async migrateUp(migrations: string[], init = false) {
    let migratedFiles: string[] = [];
    if(!init) {
      const existingMigrationsRes = await this._query(this._migrationQueries.existingMigrationsQuery);
      migratedFiles = existingMigrationsRes.map<string>(val => val.Name);
    }
    for(let migrationFile of migrations) {
      if(migratedFiles.includes(migrationFile)) continue;
      const migration = (await import(pathToFileURL(join(resolve(this._dir), migrationFile)).toString())).default;
      await migration.up(this._query);
      await this._query(this._migrationQueries.insertMigrationQuery, {name: migrationFile});
    }

    console.log(chalk.green('Successfully migrated!'));
    process.exit();
  }

  async migrateDown() {
    const lastMigrationDateRes = await this._query(this._migrationQueries.lastMigrationDateQuery) as {DateTime: string}[];
    const latestMigrations = await this._query(this._migrationQueries.latestMigrationsQuery, {lastDateTime: lastMigrationDateRes[0].DateTime}) as {DateTime: string, Name: string}[];
    if(latestMigrations[0].Name !== 'init.ts') {
      for(let migration of latestMigrations) {
        const migrationModel = (await import(pathToFileURL(join(resolve(this._dir), migration.Name)).toString())).default;
        await migrationModel.down(this._query);
        await this._query(this._migrationQueries.deleteMigrationQuery, {name: migration.Name});
      }
    }
    console.log(chalk.green('Database was successfully migrated down!'));
    process.exit();
  }

  async generate(name: string, template: string = 'migration-template.js', init = false) {
    await this.loadCfgFile();
    let fileName = this.generateName(name);
    if(init) {
      fileName = 'init';
    }
    const templateFull = readFileSync(join(packageDirectory, '/lib/', template), {encoding: 'utf8'});
    writeFileSync(join(resolve(this._dir), fileName + '.mjs'), templateFull);
  }

  private generateName(name: string) {
    const now = new Date();
    return `${now.getFullYear()}_${this.dateAddNull(now.getMonth() + 1)}_${this.dateAddNull(now.getDate())}_${this.dateAddNull(now.getHours())}_${this.dateAddNull(now.getMinutes())}_${this.dateAddNull(now.getSeconds())}_${slugify(name)}`;
  }

  private dateAddNull(val: string | number) {
    return ('0' + val).slice(-2);
  }
}