'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphql = require('graphql');

var _symbols = require('../symbols.js');

var _types = require('./types.js');

var _getColumnType = require('./getColumnType.js');

var _getColumnType2 = _interopRequireDefault(_getColumnType);

var _resolveTableSingle = require('./resolveTableSingle.js');

var _resolveTableSingle2 = _interopRequireDefault(_resolveTableSingle);

var _createConnectionType = require('./createConnectionType.js');

var _createConnectionType2 = _interopRequireDefault(_createConnectionType);

var _createConnectionArgs = require('./createConnectionArgs.js');

var _createConnectionArgs2 = _interopRequireDefault(_createConnectionArgs);

var _resolveConnection = require('./resolveConnection.js');

var _resolveConnection2 = _interopRequireDefault(_resolveConnection);

var _createProcedureReturnType = require('./createProcedureReturnType.js');

var _createProcedureReturnType2 = _interopRequireDefault(_createProcedureReturnType);

var _createProcedureArgs = require('./createProcedureArgs.js');

var _createProcedureArgs2 = _interopRequireDefault(_createProcedureArgs);

var _resolveProcedure = require('./resolveProcedure.js');

var _resolveProcedure2 = _interopRequireDefault(_resolveProcedure);

var _createProcedureCall = require('./createProcedureCall.js');

var _createProcedureCall2 = _interopRequireDefault(_createProcedureCall);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

/**
 * Creates the `GraphQLObjectType` for a table.
 *
 * This function is memoized because it will be called often for the same
 * table. Think that both the single and list fields need an instance of the
 * table type. Instead of passing the table type around as a parameter, it is
 * more functional to just memoize this function.
 *
 * @param {Client} client
 * @param {Table} table
 * @returns {GraphQLObjectType}
 */
const createTableType = (0, _lodash.memoize)(table => {
  const columns = table.getColumns();

  // If we have no fields, GraphQL will be sad. Make sure we have meaningful
  // fields by erroring if there are no columns.
  if (columns.length === 0) {
    throw new Error(`PostgreSQL schema '${ table.schema.name }' contains table '${ table.name }' ` + 'which does not have any columns. To generate a GraphQL schema all ' + 'tables must have at least one column.');
  }

  const primaryKeys = table.getPrimaryKeys();
  const isNode = primaryKeys.length !== 0;

  return new _graphql.GraphQLObjectType({
    // Creates a new type where the name is a PascalCase version of the table
    // name and the description is the associated comment in PostgreSQL.
    name: table.getTypeName(),
    description: table.description,

    // If the table has no primary keys, it shouldn’t implement `Node`.
    interfaces: isNode ? [_types.NodeType] : [],

    isTypeOf: value => value[_symbols.$$rowTable] === table,

    // Make sure all of our columns have a corresponding field. This is a thunk
    // because `createForeignKeyField` may have a circular dependency.
    fields: () => _extends({}, isNode ? {
      id: {
        type: _graphql.GraphQLID,
        description: `The globally unique identifier for this ${ table.getMarkdownTypeName() }.`,
        resolve: source => (0, _types.toID)(table.name, primaryKeys.map(column => source[column.name]))
      }
    } : {}, (0, _lodash.fromPairs)(columns.map(column => [column.getFieldName(), createColumnField(column)])), (0, _lodash.fromPairs)(table.getComputedColumns().map(procedure => [procedure.getFieldName(table.name), createProcedureField(procedure)])), (0, _lodash.fromPairs)(table.getForeignKeys().map(foreignKey => {
      const columnNames = foreignKey.nativeColumns.map(_ref => {
        let name = _ref.name;
        return name;
      });
      const name = `${ foreignKey.foreignTable.name }_by_${ columnNames.join('_and_') }`;
      return [(0, _lodash.camelCase)(name), createForeignKeyField(foreignKey)];
    })), (0, _lodash.fromPairs)(table.getReverseForeignKeys().map(foreignKey => {
      const columnNames = foreignKey.nativeColumns.map(_ref2 => {
        let name = _ref2.name;
        return name;
      });
      const name = `${ foreignKey.nativeTable.name }_nodes_by_${ columnNames.join('_and_') }`;
      return [(0, _lodash.camelCase)(name), createForeignKeyReverseField(foreignKey)];
    })))
  });
});

exports['default'] = createTableType;


const createColumnField = column => ({
  type: (0, _getColumnType2['default'])(column),
  description: column.description,
  resolve: source => source[column.name]
});

const createForeignKeyField = _ref3 => {
  let nativeTable = _ref3.nativeTable;
  let nativeColumns = _ref3.nativeColumns;
  let foreignTable = _ref3.foreignTable;
  let foreignColumns = _ref3.foreignColumns;
  return {
    type: createTableType(foreignTable),
    description: `Queries a single ${ foreignTable.getMarkdownTypeName() } node related to ` + `the ${ nativeTable.getMarkdownTypeName() } type.`,

    resolve: (0, _resolveTableSingle2['default'])(foreignTable, foreignColumns, source => nativeColumns.map(_ref4 => {
      let name = _ref4.name;
      return source[name];
    }))
  };
};

const createForeignKeyReverseField = _ref5 => {
  let nativeTable = _ref5.nativeTable;
  let nativeColumns = _ref5.nativeColumns;
  let foreignTable = _ref5.foreignTable;
  let foreignColumns = _ref5.foreignColumns;
  return {
    type: (0, _createConnectionType2['default'])(nativeTable),
    description: `Queries and returns a set of ${ nativeTable.getMarkdownTypeName() } ` + `nodes that are related to the ${ foreignTable.getMarkdownTypeName() } source ` + 'node.',

    args: (0, _createConnectionArgs2['default'])(nativeTable, nativeColumns),

    resolve: (0, _resolveConnection2['default'])(nativeTable, source => (0, _lodash.fromPairs)(foreignColumns.map((_ref6, i) => {
      let name = _ref6.name;
      return [nativeColumns[i].name, source[name]];
    })))
  };
};

const createProcedureField = procedure => {
  var _Array$from = Array.from(procedure.args);

  var _Array$from2 = _toArray(_Array$from);

  const tableArg = _Array$from2[0];

  const argEntries = _Array$from2.slice(1);

  var _tableArg = _slicedToArray(tableArg, 2);

  const tableArgName = _tableArg[0];
  const tableArgType = _tableArg[1];

  const returnTable = procedure.getReturnTable();

  const procedureArgs = (0, _createProcedureArgs2['default'])(procedure, (argName, argType) => argName === tableArgName && argType === tableArgType);

  // If this is a connection, return a completely different field…
  if (procedure.returnsSet && returnTable) {
    return {
      type: (0, _createConnectionType2['default'])(returnTable),
      description: procedure.description,

      args: _extends({}, procedureArgs, (0, _createConnectionArgs2['default'])(returnTable, true)),

      // Resolve the connection.
      resolve: (0, _resolveConnection2['default'])(returnTable, (0, _lodash.constant)({}), (source, args) => ({
        // Use the text from the procedure call.
        text: (0, _createProcedureCall2['default'])(procedure),
        // Use values from argument entries and the table source value.
        values: [source].concat(_toConsumableArray(argEntries.map(_ref7 => {
          var _ref8 = _slicedToArray(_ref7, 1);

          let name = _ref8[0];
          return args[(0, _lodash.camelCase)(name)];
        })))
      }))
    };
  }

  return {
    type: (0, _createProcedureReturnType2['default'])(procedure),
    description: procedure.description,

    // Create the arguments and omit the table argument.
    args: procedureArgs,

    // Resolve the procedure, using the source row as the argument we omit.
    resolve: (0, _resolveProcedure2['default'])(procedure, (source, args) => (0, _lodash.assign)(args, { [(0, _lodash.camelCase)(tableArgName)]: source }))
  };
};