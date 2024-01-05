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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCfgFile = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
let cfgCache;
function loadCfgFile() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cfgCache)
            return cfgCache;
        if (!(0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'appnimigration.config.js'))) {
            throw new Error('No configuration file found! Make sure that appnimigration.config.js file exists in the root of the project!');
        }
        const cfg = yield import((0, url_1.pathToFileURL)((0, path_1.join)(process.cwd(), 'appnimigration.config.js')).toString());
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
    });
}
exports.loadCfgFile = loadCfgFile;
