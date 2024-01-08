import MigrationBase from "./baseClass";

export const CURRENT_DATE = 'NOW';

export class ColumnDefinition extends MigrationBase {
  private _name?: string;
  private _columnType?: string;
  private _nullable: boolean = false;
  private _default?: string;
  private _primary: boolean = false;
  private _unique: boolean = false;
  private _autoincrement: boolean = false;
  private _references?: string;
  private _migrationCommand: MigrationCommand;

  constructor(name: string, migrationCommand: MigrationCommand) {
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

  get isPrimary() {
    return this._primary;
  }

  get migrationCommand() {
    return this._migrationCommand;
  }

  default(val: string) {
    this._default = this.processDefaultValue(val);
    return this.getProxy();
  }

  type(val: string) {
    this._columnType = val;
    return this.getProxy();
  }

  string(length: number) {
    this._columnType = `${this._databaseType === 'mssql' ? 'nvarchar' : 'varchar'}(${length})`;
    return this.getProxy();
  }

  //TODO: For references it might be good to have separate builder as well
  addReference(val: string) {
    this._references = val;
    return this.getProxy();
  }

  generate(): string {
    return this._databaseType === 'mssql' ? this.generateMssql() : this.generateMysql();
  }

  generateMssql(): string {
    return `[${this._name}] ${this._columnType}
              ${this._nullable ? 'NULL' : 'NOT NULL'}
              ${this._default ? `DEFAULT ${this._default}` : ''}
              ${this._autoincrement ? 'IDENTITY' : ''}
              ${this._primary ? 'PRIMARY KEY' : ''}
              ${this._unique && !this._primary ? 'UNIQUE KEY' : ''}
              ${this._references ? `REFERENCES ${this._references}` : ''}
            `;
  }

  generateMysql(): string {
    return `\`${this._name}\` ${this._columnType}
              ${this._nullable ? 'NULL' : 'NOT NULL'}
              ${this._default ? `DEFAULT ${this._default}` : ''}
              ${this._autoincrement ? 'AUTO_INCREMENT' : ''}
              ${this._unique && !this._primary ? 'UNIQUE KEY' : ''}
              ${this._references ? `REFERENCES ${this._references}` : ''}
            `;
  }

  getProxy(): ColumnDefinition & MigrationCommand {
    return new Proxy(this, {
      get(target: any, prop: string, receiver: any) {
        let value;
        let bind;
        if(prop in target) {
          value = Reflect.get(target, prop, receiver);
          bind = target;
        } else {
          value = Reflect.get(target._migrationCommand, prop, receiver);
          bind = target._migrationCommand;
        }
        return typeof value == 'function' ? value.bind(bind) : value;
      }
    });
  }

  //TODO: Escape it
  getName() {
    return this._name;
  }

  private processDefaultValue(val: any): any {
    if(val === CURRENT_DATE) {
      return this._databaseType === 'mssql' ? 'GETDATE()' : 'NOW()';
    }
    return val;
  }
}

//TODO: Allow creating keys with different on update and on delete
export class KeyDefinition extends MigrationBase {
  private _name?: string;
  private _keyType?: string;
  private _cols: string[] = [];
  private _references?: string;
  private _migrationCommand: MigrationCommand;

  constructor(migrationCommand: MigrationCommand, name?: string) {
    super();
    this.loadCfgFile();
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

  foreign(cols: string | string[], references: string) {
    this._keyType = 'FOREIGN KEY';
    if(Array.isArray(cols)) {
      this._cols = cols;
    } else {
      this._cols.push(cols);
    }
    this._references = references;
    return this.getProxy();
  }

  cols(...cols: string[]) {
    this._cols = cols;
    return this.getProxy();
  }

  generate() {
    return this._databaseType === 'mssql' ? this.generateMSSql() : this.generateMySql();
  }

  generateMSSql() {
    return `${this.getName()} ${this._keyType} (${this._cols.join(',')}) ${this._references ? `REFERENCES ${this._references}` : ''}`;
  }

  generateMySql() {
    return `${this.getName()} ${this._keyType} (${this._cols.join(',')}) ${this._references ? `REFERENCES ${this._references}` : ''} ${this._keyType === 'FOREIGN KEY' ? 'ON UPDATE NO ACTION ON DELETE NO ACTION' : ''}`;
  }

  //TODO: Improve handling reference in the name
  getName() {
    if(this._name) return this._name;
    return `fk_${this._cols.join('_')}_${this._references?.replace('(', '_').replace(')', '')}`
  }

  getProxy(): KeyDefinition & MigrationCommand {
    return new Proxy(this, {
      get(target: any, prop: string, receiver: any) {
        let value;
        let bind;
        if(prop in target) {
          value = Reflect.get(target, prop, receiver);
          bind = target;
        } else {
          value = Reflect.get(target._migrationCommand, prop, receiver);
          bind = target._migrationCommand;
        }
        return typeof value == 'function' ? value.bind(bind) : value;
      }
    });
  }
}

export class MigrationCommand extends MigrationBase {
  private _columnDefinitions: Array<{up: string, down: string} | ColumnDefinition> = [];
  private _type: 'create' | 'createNotExists' | 'alter';
  private _table: string;
  private _keys: Array<{up: string, down: string} | KeyDefinition> = [];

  constructor(type: 'create' | 'createNotExists' | 'alter', table: string) {
    super();
    this.loadCfgFile();
    this._type = type;
    this._table = table;
  }

  getUpSql() {
    switch(this._type) {
      case 'create':
        return this._getCreateSql();
      case 'alter':
        return this._getAlterSql();
      default:
        return this._getCreateNotExistsSql();
    }
  }

  getDownSql() {
    if(['create', 'createNotExists'].includes(this._type)) {
      return this._getDropSql();
    } else {
      return this._getUnalterSql();
    }
  }

  addColumn(name: string): ColumnDefinition & MigrationCommand {
    const column = new ColumnDefinition(name, this);
    this._columnDefinitions.push(column);
    return column as ColumnDefinition & MigrationCommand;
  }

  addColumnRaw(definition: {up: string, down: string}): MigrationCommand {
    this._columnDefinitions.push(definition);
    return this;
  }

  addKey(name?: string): KeyDefinition & MigrationCommand {
    const key = new KeyDefinition(this, name);
    this._keys.push(key);
    return key as KeyDefinition & MigrationCommand;
  }

  addKeyRaw(definition: {up: string, down: string}): MigrationCommand {
    this._keys.push(definition);
    return this;
  }

  //TODO: Add rename key option, alter column (MSSQL) and modify column (MySQL)

  private _getCreateCols(): string {
    const colDefs: string[] = [];
    let primaries: string[] = [];
    for(let def of this._columnDefinitions) {
      if(def instanceof ColumnDefinition) {
        colDefs.push(def.generate());
        if(def.isPrimary && def.getName()) {
          primaries.push(def.getName() as string);
        }
      } else {
        colDefs.push(def.up);
      }
    }
    if(this._databaseType === 'mysql' && primaries.length > 0) {
      colDefs.push(`PRIMARY KEY (${primaries.join(', ')})`);
    }
    return colDefs.join(',\n');
  }

  private _getCreateSql() {
    return `CREATE TABLE ${this._table} (
      ${this._getCreateCols()}
    );
    ${this._createKeysSql()}`
  }

  private _getCreateNotExistsSql() {
    return this._databaseType === 'mssql' ? this._getCreateNotExistsMSSql() : this._getCreateNotExistMySql();
  }

  private _getCreateNotExistsMSSql() {
    return `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this._table}' and xtype='U')
        CREATE TABLE ${this._table} (
          ${this._getCreateCols()}
        );
      ${this._createKeysSql()}
    `;
  }

  private _getCreateNotExistMySql() {
    const constraints = this._createConstraintsSql();
    return `
        CREATE TABLE IF NOT EXISTS ${this._table} (
          ${this._getCreateCols()}
          ${constraints.length > 0 ? (',\n' + constraints) : ''}
        );
    `;
  }

  private _getAlterSql() {
    const queries: string[] = [];
    for(let def of this._columnDefinitions) {
      if(def instanceof ColumnDefinition) {
        queries.push(this._getAlterAddColumnSql(def));
      } else {
        queries.push(def.down);
      }
    }
    return `
      ${queries.join('\n')}
      ${this._createKeysSql()}
    `;
  }

  private _getAlterAddColumnSql(def: ColumnDefinition) {
    return `ALTER TABLE ${this._table} ADD ${def.generate()};`;
  }

  private _getConstraintSql(def: KeyDefinition | string) {
    return `CONSTRAINT ${typeof def === 'string' ? def : def.generate()}`;
  }

  private _getAlterAddConstraintSql(def: KeyDefinition | string) {
    return `ALTER TABLE ${this._table} ADD ${this._getConstraintSql(def)};`;
  }

  private _getDropSql() {
    if(this._databaseType === 'mysql') return `DROP TABLE ${this._table};`;
    return `
      ${this._dropKeysSql()}
      DROP TABLE ${this._table};
    `;
  }

  private _getUnalterSql() {
    const queries: string[] = [];
    for(let def of this._columnDefinitions) {
      if(def instanceof ColumnDefinition) {
        queries.push(this._getDropColumnSql(def));
      } else {
        queries.push(def.down);
      }
    }
    return `
      ${this._dropKeysSql()}
      ${queries.join('\n')}
    `
  }

  private _getDropColumnSql(def: ColumnDefinition) {
    const queries: string[] = [];
    if(def.isDefault && this._databaseType === 'mssql') {
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

  private _getDropKeySql(def: KeyDefinition | string) {
    return `ALTER TABLE ${this._table} DROP ${this._databaseType === 'mssql' ? 'KEY' : 'INDEX'} ${typeof def === 'string' ? def : def.getName()};`;
  }

  private _createKeysSql() {
    const queries: string[] = [];
    for(let key of this._keys) {
      if(key instanceof KeyDefinition) {
        queries.push(this._getAlterAddConstraintSql(key));
      } else {
        queries.push(this._getAlterAddConstraintSql(key.up));
      }
    }
    return queries.join('\n');
  }

  private _createConstraintsSql() {
    const queries: string[] = [];
    for(let key of this._keys) {
      if(key instanceof KeyDefinition) {
        queries.push(this._getConstraintSql(key));
      } else {
        queries.push(this._getConstraintSql(key.up));
      }
    }
    return queries.join(',\n');
  }

  private _dropKeysSql() {
    const queries: string[] = [];
    for(let key of this._keys) {
      if(key instanceof KeyDefinition) {
        queries.push(this._getDropKeySql(key));
      } else {
        queries.push(this._getDropKeySql(key.up));
      }
    }
    return queries.join('\n');
  }
}

export function createTableIfNotExist(name: string): MigrationCommand {
  return new MigrationCommand('createNotExists', name);
}

export function createTable(name: string): MigrationCommand {
  return new MigrationCommand('create', name);
}

export function alterTable(table: string): MigrationCommand {
  return new MigrationCommand('alter', table);
}

export function createMigration(type: 'create' | 'createNotExists' | 'alter', table: string): MigrationCommand {
  return new MigrationCommand(type, table);
}