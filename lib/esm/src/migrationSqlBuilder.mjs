import MigrationBase from "./baseClass";
export const CURRENT_DATE = 'NOW';
export class ColumnDefinition extends MigrationBase {
    _name;
    _columnType;
    _nullable = false;
    _default;
    _primary = false;
    _unique = false;
    _autoincrement = false;
    _references;
    _migrationCommand;
    constructor(name, migrationCommand) {
        super();
        this._name = name;
        this._migrationCommand = migrationCommand;
        this.loadCfgFile();
        return this.getProxy();
    }
    get nullable() {
        this._nullable = true;
        return this.getProxy();
    }
    get primary() {
        this._primary = true;
        return this.getProxy();
    }
    get unique() {
        this._unique = true;
        return this.getProxy();
    }
    get autoincrement() {
        this._autoincrement = true;
        return this.getProxy();
    }
    get uuid() {
        this.type(this._databaseType === 'mssql' ? 'uniqueidentifier' : 'varchar(64)');
        return this.getProxy();
    }
    get bit() {
        this.type('bit');
        return this.getProxy();
    }
    get int() {
        this.type('int');
        return this.getProxy();
    }
    get datetime() {
        this.type(this._databaseType === 'mssql' ? 'datetime2' : 'datetime');
        return this.getProxy();
    }
    /** @deprecated */
    get datetime2() {
        this.type('datetime2');
        return this.getProxy();
    }
    get isDefault() {
        return this._default;
    }
    get migrationCommand() {
        return this._migrationCommand;
    }
    default(val) {
        this._default = this.processDefaultValue(val);
        return this.getProxy();
    }
    type(val) {
        this._columnType = val;
        return this.getProxy();
    }
    string(length) {
        this._columnType = `${this._databaseType === 'mssql' ? 'nvarchar' : 'varchar'}(${length})`;
        return this.getProxy();
    }
    //TODO: For references it might be good to have separate builder as well
    addReference(val) {
        this._references = val;
        return this.getProxy();
    }
    generate() {
        return this._databaseType === 'mssql' ? this.generateMssql() : this.generateMysql();
    }
    generateMssql() {
        return `[${this._name}] ${this._columnType}
              ${this._nullable ? 'NULL' : 'NOT NULL'}
              ${this._default ? `DEFAULT ${this._default}` : ''}
              ${this._autoincrement ? 'IDENTITY' : ''}
              ${this._primary ? 'PRIMARY KEY' : ''}
              ${this._unique && !this._primary ? 'UNIQUE KEY' : ''}
              ${this._references ? `REFERENCES ${this._references}` : ''}
            `;
    }
    //TODO: This primary key is not going to work for mysql, it has to be added at the end of the create table cols PRIMARY KEY (column)
    generateMysql() {
        return `\`${this._name}\` ${this._columnType}
              ${this._nullable ? 'NULL' : 'NOT NULL'}
              ${this._default ? `DEFAULT ${this._default}` : ''}
              ${this._autoincrement ? 'AUTO_INCREMENT' : ''}
              ${this._unique && !this._primary ? 'UNIQUE KEY' : ''}
              ${this._primary ? 'PRIMARY KEY' : ''}
              ${this._references ? `REFERENCES ${this._references}` : ''}
            `;
    }
    getProxy() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                let value;
                let bind;
                if (prop in target) {
                    value = Reflect.get(target, prop, receiver);
                    bind = target;
                }
                else {
                    value = Reflect.get(target._migrationCommand, prop, receiver);
                    bind = target._migrationCommand;
                }
                return typeof value == 'function' ? value.bind(bind) : value;
            }
        });
    }
    getName() {
        return this._name;
    }
    processDefaultValue(val) {
        if (val === CURRENT_DATE) {
            return this._databaseType === 'mssql' ? 'GETDATE()' : 'NOW()';
        }
        return val;
    }
}
export class KeyDefinition {
    _name;
    _keyType;
    _cols = [];
    _references;
    _migrationCommand;
    constructor(name, migrationCommand) {
        this._name = name;
        this._migrationCommand = migrationCommand;
        return this.getProxy();
    }
    get unique() {
        this._keyType = 'UNIQUE';
        return this.getProxy();
    }
    get primary() {
        this._keyType = 'PRIMARY KEY';
        return this.getProxy();
    }
    get migrationCommand() {
        return this._migrationCommand;
    }
    foreign(cols, references) {
        this._keyType = 'FOREIGN KEY';
        this._cols = cols;
        this._references = references;
        return this.getProxy();
    }
    cols(...cols) {
        this._cols = cols;
        return this.getProxy();
    }
    generate() {
        return `${this._name} ${this._keyType} (${this._cols.join(',')}) ${this._references ? `REFERENCES ${this._references}` : ''}`;
    }
    getName() {
        return this._name;
    }
    getProxy() {
        return new Proxy(this, {
            get(target, prop, receiver) {
                let value;
                let bind;
                if (prop in target) {
                    value = Reflect.get(target, prop, receiver);
                    bind = target;
                }
                else {
                    value = Reflect.get(target._migrationCommand, prop, receiver);
                    bind = target._migrationCommand;
                }
                return typeof value == 'function' ? value.bind(bind) : value;
            }
        });
    }
}
export class MigrationCommand extends MigrationBase {
    _columnDefinitions = [];
    _type;
    _table;
    _keys = [];
    constructor(type, table) {
        super();
        this._type = type;
        this._table = table;
    }
    getUpSql() {
        switch (this._type) {
            case 'create':
                return this._getCreateSql();
            case 'alter':
                return this._getAlterSql();
            default:
                return this._getCreateNotExistsSql();
        }
    }
    getDownSql() {
        if (['create', 'createNotExists'].includes(this._type)) {
            return this._getDropSql();
        }
        else {
            return this._getUnalterSql();
        }
    }
    addColumn(name) {
        const column = new ColumnDefinition(name, this);
        this._columnDefinitions.push(column);
        return column;
    }
    addColumnRaw(definition) {
        this._columnDefinitions.push(definition);
        return this;
    }
    addKey(name) {
        const key = new KeyDefinition(name, this);
        this._keys.push(key);
        return key;
    }
    addKeyRaw(definition) {
        this._keys.push(definition);
        return this;
    }
    //TODO: Add rename key option, alter column (MSSQL) and modify column (MySQL)
    _getCreateCols() {
        const colDefs = [];
        for (let def of this._columnDefinitions) {
            if (def instanceof ColumnDefinition) {
                colDefs.push(def.generate());
            }
            else {
                colDefs.push(def.up);
            }
        }
        return colDefs.join(',\n');
    }
    _getCreateSql() {
        return `CREATE TABLE ${this._table} (
      ${this._getCreateCols()}
    );
    ${this._createKeysSql()}`;
    }
    _getCreateNotExistsSql() {
        return this._databaseType === 'mssql' ? this._getCreateNotExistsMSSql() : this._getCreateNotExistMySql();
    }
    _getCreateNotExistsMSSql() {
        return `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this._table}' and xtype='U')
        CREATE TABLE ${this._table} (
          ${this._getCreateCols()}
        );
      ${this._createKeysSql()}
    `;
    }
    _getCreateNotExistMySql() {
        return `
        CREATE TABLE IF NOT EXISTS ${this._table} (
          ${this._getCreateCols()}
        );
      ${this._createKeysSql()}
    `;
    }
    _getAlterSql() {
        const queries = [];
        for (let def of this._columnDefinitions) {
            if (def instanceof ColumnDefinition) {
                queries.push(this._getAlterAddColumnSql(def));
            }
            else {
                queries.push(def.down);
            }
        }
        return `
      ${queries.join('\n')}
      ${this._createKeysSql()}
    `;
    }
    _getAlterAddColumnSql(def) {
        return `ALTER TABLE ${this._table} ADD ${def.generate()};`;
    }
    _getAlterAddConstraintSql(def) {
        return `ALTER TABLE ${this._table} ADD CONSTRAINT ${typeof def === 'string' ? def : def.generate()};`;
    }
    _getDropSql() {
        return `
      ${this._dropKeysSql()}
      DROP TABLE ${this._table};
    `;
    }
    _getUnalterSql() {
        const queries = [];
        for (let def of this._columnDefinitions) {
            if (def instanceof ColumnDefinition) {
                queries.push(this._getDropColumnSql(def));
            }
            else {
                queries.push(def.down);
            }
        }
        return `
      ${this._dropKeysSql()}
      ${queries.join('\n')}
    `;
    }
    _getDropColumnSql(def) {
        const queries = [];
        if (def.isDefault && this._databaseType === 'mssql') {
            queries.push(`
        DECLARE @ConstraintName nvarchar(255), @SQL nvarchar(2000);
        SELECT @ConstraintName = dc.name
        FROM sys.default_constraints AS DC
        LEFT JOIN sys.objects AS O ON O.object_id = DC.parent_object_id
        LEFT JOIN sys.columns c ON o.object_id = c.object_id AND DC.parent_column_id = c.column_id
        WHERE O.name = '${this._table}' AND C.name = '${def.getName()}';
        SET @SQL = 'ALTER TABLE ${this._table} DROP CONSTRAINT ' + @ConstraintName;
        EXEC(@SQL);
      `);
        }
        queries.push(`ALTER TABLE ${this._table} DROP COLUMN ${def.getName()};`);
        return queries.join('\n');
    }
    _getDropKeySql(def) {
        return `ALTER TABLE ${this._table} DROP ${this._databaseType === 'mssql' ? 'KEY' : 'INDEX'} ${typeof def === 'string' ? def : def.getName()};`;
    }
    _createKeysSql() {
        const queries = [];
        for (let key of this._keys) {
            if (key instanceof KeyDefinition) {
                queries.push(this._getAlterAddConstraintSql(key));
            }
            else {
                queries.push(this._getAlterAddConstraintSql(key.up));
            }
        }
        return queries.join('\n');
    }
    _dropKeysSql() {
        const queries = [];
        for (let key of this._keys) {
            if (key instanceof KeyDefinition) {
                queries.push(this._getDropKeySql(key));
            }
            else {
                queries.push(this._getDropKeySql(key.up));
            }
        }
        return queries.join('\n');
    }
}
export function createTableIfNotExist(name) {
    return new MigrationCommand('createNotExists', name);
}
export function createTable(name) {
    return new MigrationCommand('create', name);
}
export function alterTable(table) {
    return new MigrationCommand('alter', table);
}
export function createMigration(type, table) {
    return new MigrationCommand(type, table);
}
