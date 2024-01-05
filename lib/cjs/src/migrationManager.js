"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationManager = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const slugify_1 = __importDefault(require("slugify"));
const chalk_1 = __importDefault(require("chalk"));
const url_1 = require("url");
const baseClass_1 = __importDefault(require("./baseClass"));
const migrationManagerQueries_1 = __importDefault(require("./migrationManagerQueries"));
const packageDirectory = (0, path_1.resolve)('node_modules/@appnificent/appnimigration');
class MigrationManager extends baseClass_1.default {
    get _migrationQueries() {
        return migrationManagerQueries_1.default[this._databaseType || 'mysql'];
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadCfgFile();
            if (!(0, fs_1.existsSync)((0, path_1.resolve)(this._dir))) {
                (0, fs_1.mkdirSync)((0, path_1.resolve)(this._dir));
            }
            else {
                this.error('Cannot init migrations, migration folder already exists!');
            }
            this.generate('init', 'init-migration.js', true);
            const migrations = (0, fs_1.readdirSync)((0, path_1.resolve)(this._dir));
            this.migrateUp(migrations, true);
        });
    }
    migrate(direction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadCfgFile();
            if (!(0, fs_1.existsSync)((0, path_1.resolve)(this._dir))) {
                this.error('No folder with migrations found!');
            }
            if (direction === 'up') {
                const migrations = (0, fs_1.readdirSync)((0, path_1.resolve)(this._dir));
                this.migrateUp(migrations);
            }
            else {
                this.migrateDown();
            }
        });
    }
    migrateUp(migrations, init = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let migratedFiles = [];
            if (!init) {
                const existingMigrationsRes = yield this._query(this._migrationQueries.existingMigrationsQuery);
                migratedFiles = existingMigrationsRes.map(val => val.Name);
            }
            for (let migrationFile of migrations) {
                if (migratedFiles.includes(migrationFile))
                    continue;
                const migration = (yield import((0, url_1.pathToFileURL)((0, path_1.join)((0, path_1.resolve)(this._dir), migrationFile)).toString())).default;
                yield migration.up(this._query);
                yield this._query(this._migrationQueries.insertMigrationQuery, { name: migrationFile });
            }
            console.log(chalk_1.default.green('Successfully migrated!'));
            process.exit();
        });
    }
    migrateDown() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastMigrationDateRes = yield this._query(this._migrationQueries.lastMigrationDateQuery);
            const latestMigrations = yield this._query(this._migrationQueries.latestMigrationsQuery, { lastDateTime: lastMigrationDateRes[0].DateTime });
            if (latestMigrations[0].Name !== 'init.ts') {
                for (let migration of latestMigrations) {
                    const migrationModel = (yield import((0, url_1.pathToFileURL)((0, path_1.join)((0, path_1.resolve)(this._dir), migration.Name)).toString())).default;
                    yield migrationModel.down(this._query);
                    yield this._query(this._migrationQueries.deleteMigrationQuery, { name: migration.Name });
                }
            }
            console.log(chalk_1.default.green('Database was successfully migrated down!'));
            process.exit();
        });
    }
    generate(name, template = 'migration-template.js', init = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadCfgFile();
            let fileName = this.generateName(name);
            if (init) {
                fileName = 'init';
            }
            const templateFull = (0, fs_1.readFileSync)((0, path_1.join)(packageDirectory, '/lib/', template), { encoding: 'utf8' });
            (0, fs_1.writeFileSync)((0, path_1.join)((0, path_1.resolve)(this._dir), fileName + '.mjs'), templateFull);
        });
    }
    generateName(name) {
        const now = new Date();
        return `${now.getFullYear()}_${this.dateAddNull(now.getMonth() + 1)}_${this.dateAddNull(now.getDate())}_${this.dateAddNull(now.getHours())}_${this.dateAddNull(now.getMinutes())}_${this.dateAddNull(now.getSeconds())}_${(0, slugify_1.default)(name)}`;
    }
    dateAddNull(val) {
        return ('0' + val).slice(-2);
    }
}
exports.MigrationManager = MigrationManager;
