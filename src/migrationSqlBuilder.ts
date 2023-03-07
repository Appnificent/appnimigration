export class ColumnDefinition {
  private _name?: string;
  private _columnType?: string;
  private _nullable: boolean = false;
  private _default?: string;
  private _primary: boolean = false;
  private _unique: boolean = false;
  private _references?: string;
  private _migrationCommand: MigrationCommand;

  constructor(name: string, migrationCommand: MigrationCommand) {
    this._name = name;
    this._migrationCommand = migrationCommand;
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

  get uuid() {
    this.type('uniqueidentifier');
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

  get datetime2() {
    this.type('datetime2');
    return this.getProxy();
  }

  get migrationCommand() {
    return this._migrationCommand;
  }

  default(val: string) {
    this._default = val;
    return this.getProxy();
  }

  type(val: string) {
    this._columnType = val;
    return this.getProxy();
  }

  //TODO: For references it might be good to have separate builder as well
  addReference(val: string) {
    this._references = val;
    return this.getProxy();
  }

  generate(): string {
    return `[${this._name}] ${this._columnType}
              ${this._nullable ? 'NULL' : 'NOT NULL'}
              ${this._default ? `DEFAULT ${this._default}` : ''}
              ${this._primary ? 'PRIMARY KEY' : ''}
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

  getName() {
    return this._name;
  }
}

export class KeyDefinition {
  private _name: string;
  private _keyType?: string;
  private _cols: string[] = [];
  private _references?: string;
  private _migrationCommand: MigrationCommand;

  constructor(name: string, migrationCommand: MigrationCommand) {
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

  foreign(cols: string[], references: string) {
    this._keyType = 'FOREIGN KEY';
    this._cols = cols;
    this._references = references;
    return this.getProxy();
  }

  cols(...cols: string[]) {
    this._cols = cols;
    return this.getProxy();
  }

  generate() {
    return `${this._name} ${this._keyType} (${this._cols.join(',')}) ${this._references ? `REFERENCES ${this._references}` : ''}`;
  }

  getName() {
    return this._name;
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

export class MigrationCommand {
  private _columnDefinitions: Array<{up: string, down: string} | ColumnDefinition> = [];
  private _type: 'create' | 'createNotExists' | 'alter';
  private _table: string;
  private _keys: Array<{up: string, down: string} | KeyDefinition> = [];

  constructor(type: 'create' | 'createNotExists' | 'alter', table: string) {
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

  addKey(name: string): KeyDefinition & MigrationCommand {
    const key = new KeyDefinition(name, this);
    this._keys.push(key);
    return key as KeyDefinition & MigrationCommand;
  }

  addKeyRaw(definition: {up: string, down: string}): MigrationCommand {
    this._keys.push(definition);
    return this;
  }

  private _getCreateCols(): string {
    const colDefs: string[] = [];
    for(let def of this._columnDefinitions) {
      if(def instanceof ColumnDefinition) {
        colDefs.push(def.generate());
      } else {
        colDefs.push(def.up);
      }
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
    return `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this._table}' and xtype='U')
        CREATE TABLE ${this._table} (
          ${this._getCreateCols()}
        );
      ${this._createKeysSql()}
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

  private _getAlterAddConstraintSql(def: KeyDefinition | string) {
    return `ALTER TABLE ${this._table} ADD CONSTRAINT ${typeof def === 'string' ? def : def.generate()};`;
  }

  private _getDropSql() {
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

  //TODO: Drop also column constraints
  private _getDropColumnSql(def: ColumnDefinition) {
    return `ALTER TABLE ${this._table} DROP COLUMN ${def.getName()};`;
  }

  private _getDropKeySql(def: KeyDefinition | string) {
    return `ALTER TABLE ${this._table} DROP KEY ${typeof def === 'string' ? def : def.getName()};`;
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