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
const chalk_1 = __importDefault(require("chalk"));
const helpers_1 = require("./helpers");
class MigrationBase {
    constructor() {
        this._dir = './migrations';
        this._query = (query) => Promise.resolve([query]);
    }
    loadCfgFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cfg = yield (0, helpers_1.loadCfgFile)();
                this._query = cfg.query;
                this._databaseType = cfg.database.strToLower();
                if (cfg.dir) {
                    this._dir = cfg.dir;
                }
            }
            catch (err) {
                this.error(err.message);
            }
        });
    }
    error(msg) {
        console.log(chalk_1.default.red(msg));
        process.exit();
    }
}
exports.default = MigrationBase;
