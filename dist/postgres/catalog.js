'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Procedure = exports.ForeignKey = exports.TableType = exports.Domain = exports.Enum = exports.Type = exports.Column = exports.Table = exports.Schema = exports.Catalog = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

const replaceInsideUnderscores = (string, replacer) => {
  var _$exec = /^(_*)(.*?)(_*)$/.exec(string);

  var _$exec2 = _slicedToArray(_$exec, 4);

  const start = _$exec2[1];
  const substring = _$exec2[2];
  const finish = _$exec2[3];

  return `${ start }${ replacer(substring) }${ finish }`;
};

const camelCaseInsideUnderscores = string => replaceInsideUnderscores(string, _lodash.camelCase);

const pascalCaseInsideUnderscores = string => replaceInsideUnderscores(string, substring => (0, _lodash.upperFirst)((0, _lodash.camelCase)(substring)));

/**
 * A catalog of all objects relevant in the database to PostGraphQL.
 */
class Catalog {
  constructor() {
    this._schemas = new Map();
    this._tables = new Map();
    this._columns = new Map();
    this._types = new Map();
    this._enums = new Map();
    this._foreignKeys = [];
    this._procedures = new Map();
  }

  addSchema(schema) {
    this._schemas.set(schema.name, schema);
  }

  getSchema(s) {
    return this._schemas.get(s);
  }

  addTable(table) {
    this._tables.set(`${ table.schema.name }.${ table.name }`, table);
  }

  getTable(s, t) {
    return this._tables.get(`${ s }.${ t }`);
  }

  addColumn(column) {
    this._columns.set(`${ column.table.schema.name }.${ column.table.name }.${ column.name }`, column);
  }

  getColumn(s, t, c) {
    return this._columns.get(`${ s }.${ t }.${ c }`);
  }

  addType(type) {
    this._types.set(type.id, type);
  }

  getType(typeId) {
    if (!this._types.has(typeId)) this._types.set(typeId, new Type(typeId));
    return this._types.get(typeId);
  }

  addEnum(enum_) {
    this._enums.set(`${ enum_.schema.name }.${ enum_.name }`, enum_);
    this.addType(enum_);
  }

  getEnum(s, e) {
    return this._enums.get(`${ s }.${ e }`);
  }

  addForeignKey(foreignKey) {
    this._foreignKeys.push(foreignKey);
  }

  addProcedure(procedure) {
    this._procedures.set(`${ procedure.schema.name }.${ procedure.name }`, procedure);
  }

  getProcedure(s, p) {
    return this._procedures.get(`${ s }.${ p }`);
  }
}

exports.Catalog = Catalog; /**
                            * Represents a PostgreSQL schema.
                            *
                            * @member {Catalog} catalog
                            * @member {string} name
                            * @member {string} description
                            * @member {Table[]} tables
                            */

class Schema {
  constructor(_ref) {
    let catalog = _ref.catalog;
    let name = _ref.name;
    let description = _ref.description;
    this.getTables = (0, _lodash.once)(() => {
      const tables = [];
      for (const _ref2 of this.catalog._tables.entries()) {
        var _ref3 = _slicedToArray(_ref2, 2);

        const table = _ref3[1];

        if (table.schema === this) tables.push(table);
      }return tables;
    });
    this.getProcedures = (0, _lodash.once)(() => {
      const procedures = [];
      for (const _ref4 of this.catalog._procedures.entries()) {
        var _ref5 = _slicedToArray(_ref4, 2);

        const procedure = _ref5[1];

        if (procedure.schema === this) procedures.push(procedure);
      }return procedures;
    });

    this.catalog = catalog;
    this.name = name;
    this.description = description;
  }

}

exports.Schema = Schema; /**
                          * Represents a PostgreSQL table.
                          *
                          * @member {Schema} schema
                          * @member {string} name
                          * @member {string} description
                          * @member {boolean} isInsertable
                          * @member {boolean} isUpdatable
                          * @member {boolean} isDeletable
                          * @member {Column[]} columns
                          * @member {ForeignKey[]} foreignKeys
                          * @member {ForeignKey[]} reverseForeignKeys
                          */

class Table {

  constructor(_ref6) {
    let schema = _ref6.schema;
    let name = _ref6.name;
    let description = _ref6.description;
    let isInsertable = _ref6.isInsertable;
    let isUpdatable = _ref6.isUpdatable;
    let isDeletable = _ref6.isDeletable;
    this._uniqueConstraints = [];
    this.getColumns = (0, _lodash.once)(() => {
      const columns = [];
      for (const _ref7 of this.schema.catalog._columns.entries()) {
        var _ref8 = _slicedToArray(_ref7, 2);

        const column = _ref8[1];

        if (column.table === this) columns.push(column);
      }return columns;
    });
    this.getPrimaryKeys = (0, _lodash.once)(() => {
      return this.getColumns().filter(_ref9 => {
        let isPrimaryKey = _ref9.isPrimaryKey;
        return isPrimaryKey;
      });
    });
    this.getForeignKeys = (0, _lodash.once)(() => {
      return this.schema.catalog._foreignKeys.filter(_ref10 => {
        let nativeTable = _ref10.nativeTable;
        return nativeTable === this;
      });
    });
    this.getReverseForeignKeys = (0, _lodash.once)(() => {
      return this.schema.catalog._foreignKeys.filter(_ref11 => {
        let foreignTable = _ref11.foreignTable;
        return foreignTable === this;
      });
    });
    this.getComputedColumns = (0, _lodash.once)(() => {
      // Our computed columns will be any procedure where the first argument is
      // a table type.
      return Array.from(this.schema.catalog._procedures).map(entry => entry[1]).filter(procedure => {
        const firstArgEntry = Array.from(procedure.args)[0];
        if (!firstArgEntry) return false;
        const firstArgType = firstArgEntry[1];
        return firstArgType && firstArgType.isTableType && firstArgType.table === this;
      });
    });

    this.getUniqueConstraints = () => this._uniqueConstraints;

    this.getIdentifier = (0, _lodash.once)(() => {
      return `"${ this.schema.name }"."${ this.name }"`;
    });
    this.getFieldName = (0, _lodash.once)(() => {
      return camelCaseInsideUnderscores(this.name);
    });
    this.getTypeName = (0, _lodash.once)(() => {
      return pascalCaseInsideUnderscores(this.name);
    });
    this.getMarkdownTypeName = (0, _lodash.once)(() => {
      return `\`${ this.getTypeName() }\``;
    });

    this.schema = schema;
    this.name = name;
    this.description = description;
    this.isInsertable = isInsertable;
    this.isUpdatable = isUpdatable;
    this.isDeletable = isDeletable;
  }

}

exports.Table = Table; /**
                        * Represents a PostgreSQL column.
                        *
                        * @member {Table} table
                        * @member {string} name
                        * @member {string} description
                        * @member {number} num
                        * @member {Type} type
                        * @member {boolean} isNullable
                        * @member {boolean} isPrimaryKey
                        * @member {boolean} hasDefault
                        */

class Column {
  constructor(_ref12) {
    let table = _ref12.table;
    let name = _ref12.name;
    let description = _ref12.description;
    let num = _ref12.num;
    let type = _ref12.type;
    var _ref12$isNullable = _ref12.isNullable;
    let isNullable = _ref12$isNullable === undefined ? true : _ref12$isNullable;
    let isPrimaryKey = _ref12.isPrimaryKey;
    var _ref12$hasDefault = _ref12.hasDefault;
    let hasDefault = _ref12$hasDefault === undefined ? false : _ref12$hasDefault;
    this.getIdentifier = (0, _lodash.once)(() => {
      return `${ this.table.getIdentifier() }."${ this.name }"`;
    });
    this.getFieldName = (0, _lodash.once)(() => {
      // There is a conflict with the `Node` interface. Therefore we need to alias `rowId`.
      if (this.name === 'id') return 'rowId';
      return camelCaseInsideUnderscores(this.name);
    });
    this.getMarkdownFieldName = (0, _lodash.once)(() => {
      return `\`${ this.getFieldName() }\``;
    });

    this.table = table;
    this.name = name;
    this.description = description;
    this.num = num;
    this.type = type;
    this.isNullable = isNullable;
    this.isPrimaryKey = isPrimaryKey;
    this.hasDefault = hasDefault;
  }

}

exports.Column = Column; /**
                          * Represents a type defined in a PostgreSQL database.
                          *
                          * @member {number} id
                          */

class Type {
  constructor(id) {
    this.id = id;
  }
}

exports.Type = Type; /**
                      * Represents a user defined enum PostgreSQL column.
                      *
                      * @member {Schema} schema
                      * @member {string} name
                      * @member {string[]} variants
                      */

class Enum extends Type {

  constructor(_ref13) {
    let id = _ref13.id;
    let schema = _ref13.schema;
    let name = _ref13.name;
    let variants = _ref13.variants;

    super(id);
    this.isEnum = true;
    this.schema = schema;
    this.name = name;
    this.variants = variants;
  }
}

exports.Enum = Enum; /**
                      * Represents a user defined domain PostgreSQL column.
                      *
                      * @member {Schema} schema
                      * @member {string} name
                      * @member {Type} baseType
                      */

class Domain extends Type {

  constructor(_ref14) {
    let id = _ref14.id;
    let schema = _ref14.schema;
    let name = _ref14.name;
    let baseType = _ref14.baseType;

    super(id);
    this.isDomain = true;
    this.schema = schema;
    this.name = name;
    this.baseType = baseType;
  }
}

exports.Domain = Domain; /**
                          * Represents a composite PostgreSQL table type.
                          *
                          * @member {Table} table
                          */

class TableType extends Type {

  constructor(_ref15) {
    let id = _ref15.id;
    let table = _ref15.table;

    super(id);
    this.isTableType = true;
    this.table = table;
  }
}

exports.TableType = TableType; /**
                                * A foreign key describing a reference between one table and another.
                                *
                                * @member {Catalog} catalog
                                * @member {Table} nativeTable
                                * @member {Column[]} nativeColumns
                                * @member {Table} foreignTable
                                * @member {Column[]} foreignColumns
                                */

class ForeignKey {
  constructor(_ref16) {
    let nativeTable = _ref16.nativeTable;
    let nativeColumns = _ref16.nativeColumns;
    let foreignTable = _ref16.foreignTable;
    let foreignColumns = _ref16.foreignColumns;

    this.nativeTable = nativeTable;
    this.nativeColumns = nativeColumns;
    this.foreignTable = foreignTable;
    this.foreignColumns = foreignColumns;
  }
}

exports.ForeignKey = ForeignKey; /**
                                  * A user defined remote procedure in PostgreSQL which can be called by
                                  * PostGraphQL.
                                  *
                                  * @member {Schema} schema
                                  * @member {string} name
                                  * @member {boolean} isMutation
                                  * @member {boolean} isStrict
                                  * @member {boolean} returnsSet
                                  * @member {Map.<string, Type>} args
                                  * @member {Type} returnType
                                  */

class Procedure {
  constructor(_ref17) {
    let schema = _ref17.schema;
    let name = _ref17.name;
    let description = _ref17.description;
    var _ref17$isMutation = _ref17.isMutation;
    let isMutation = _ref17$isMutation === undefined ? true : _ref17$isMutation;
    var _ref17$isStrict = _ref17.isStrict;
    let isStrict = _ref17$isStrict === undefined ? false : _ref17$isStrict;
    var _ref17$returnsSet = _ref17.returnsSet;
    let returnsSet = _ref17$returnsSet === undefined ? false : _ref17$returnsSet;
    var _ref17$args = _ref17.args;
    let args = _ref17$args === undefined ? new Map() : _ref17$args;
    let returnType = _ref17.returnType;

    this.schema = schema;
    this.name = name;
    this.description = description;
    this.isMutation = isMutation;
    this.isStrict = isStrict;
    this.returnsSet = returnsSet;
    this.args = args;
    this.returnType = returnType;
  }

  hasTableArg() {
    return Boolean(Array.from(this.args).find(_ref18 => {
      var _ref19 = _slicedToArray(_ref18, 2);

      let type = _ref19[1];
      return type.isTableType;
    }));
  }

  getReturnTable() {
    return this.returnType.isTableType && this.returnType.table;
  }

  getFieldName(prefix) {
    if (prefix && (0, _lodash.startsWith)(this.name, `${ prefix }_`)) return camelCaseInsideUnderscores(this.name.slice(prefix.length + 1));

    return camelCaseInsideUnderscores(this.name);
  }

  getMarkdownFieldName() {
    return `\`${ this.getFieldName() }\``;
  }
}
exports.Procedure = Procedure;