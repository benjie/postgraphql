'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _graphql = require('graphql');

var _lodash = require('lodash');

var _symbols = require('../../symbols.js');

var _SQLBuilder = require('../../SQLBuilder.js');

var _SQLBuilder2 = _interopRequireDefault(_SQLBuilder);

var _getType = require('../getType.js');

var _getType2 = _interopRequireDefault(_getType);

var _createTableType = require('../createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _getPayloadInterface = require('./getPayloadInterface.js');

var _getPayloadInterface2 = _interopRequireDefault(_getPayloadInterface);

var _getPayloadFields = require('./getPayloadFields.js');

var _getPayloadFields2 = _interopRequireDefault(_getPayloadFields);

var _clientMutationId = require('./clientMutationId.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/**
 * Creates a mutation which will update a single existing row.
 *
 * @param {Table} table
 * @returns {GraphQLFieldConfig}
 */
const createUpdateMutationField = table => ({
  type: createPayloadType(table),
  description: `Updates a single node of type ${ table.getMarkdownTypeName() }.`,

  args: {
    input: {
      type: new _graphql.GraphQLNonNull(createInputType(table))
    }
  },

  resolve: resolveUpdate(table)
});

exports['default'] = createUpdateMutationField;


const createInputType = table => new _graphql.GraphQLInputObjectType({
  name: `Update${ table.getTypeName() }Input`,
  description: `Locates the ${ table.getMarkdownTypeName() } node to update and specifies some ` + 'new field values. Primary key fields are required to be able to locate ' + 'the node to update.',
  fields: _extends({}, (0, _lodash.fromPairs)(table.getPrimaryKeys().map(column => [column.getFieldName(), {
    type: new _graphql.GraphQLNonNull((0, _getType2['default'])(column.type)),
    description: `Matches the ${ column.getMarkdownFieldName() } field of the node.`
  }])), (0, _lodash.fromPairs)(table.getColumns().map(column => [`new${ (0, _lodash.upperFirst)(column.getFieldName()) }`, {
    type: (0, _getType2['default'])(column.type),
    description: `Updates the node’s ${ column.getMarkdownFieldName() } field with this new value.`
  }])), {
    // And the client mutation id…
    clientMutationId: _clientMutationId.inputClientMutationId
  })
});

const createPayloadType = table => new _graphql.GraphQLObjectType({
  name: `Update${ table.getTypeName() }Payload`,
  description: `Contains the ${ table.getMarkdownTypeName() } node updated by the mutation.`,
  interfaces: [(0, _getPayloadInterface2['default'])(table.schema)],
  fields: _extends({
    [table.getFieldName()]: {
      type: (0, _createTableType2['default'])(table),
      description: `The updated ${ table.getMarkdownTypeName() }.`,
      resolve: source => source.output
    }
  }, (0, _getPayloadFields2['default'])(table.schema))
});

const resolveUpdate = table => {
  // We use our SQL builder here instead of a prepared statement/data loader
  // solution because this query can get super dynamic.
  const columns = table.getColumns();
  const primaryKeys = table.getPrimaryKeys();

  return (() => {
    var _ref = _asyncToGenerator(function* (source, args, _ref2) {
      let client = _ref2.client;
      const input = args.input;
      const clientMutationId = input.clientMutationId;


      const setClauses = [];
      const setValues = [];
      const whereClauses = [];
      const whereValues = [];

      for (const column of columns) {
        const value = input[`new${ (0, _lodash.upperFirst)(column.getFieldName()) }`];
        if (typeof value === 'undefined') continue;
        setClauses.push(`"${ column.name }" = $`);
        setValues.push(value);
      }

      for (const column of primaryKeys) {
        const value = input[column.getFieldName()];
        whereClauses.push(`${ column.getIdentifier() } = $`);
        whereValues.push(value);
      }

      var _ref3 = yield client.queryAsync(new _SQLBuilder2['default']().add(`update ${ table.getIdentifier() }`).add('set').add(setClauses.join(', '), setValues).add('where').add(whereClauses.join(' and '), whereValues).add('returning *'));

      var _ref3$rows = _slicedToArray(_ref3.rows, 1);

      const row = _ref3$rows[0];


      const output = row ? (row[_symbols.$$rowTable] = table, row) : null;

      return {
        output,
        clientMutationId
      };
    });

    return function (_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  })();
};