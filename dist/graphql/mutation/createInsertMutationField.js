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

var _getColumnType = require('../getColumnType.js');

var _getColumnType2 = _interopRequireDefault(_getColumnType);

var _createTableType = require('../createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _createConnectionType = require('../createConnectionType.js');

var _createConnectionArgs = require('../createConnectionArgs.js');

var _getPayloadInterface = require('./getPayloadInterface.js');

var _getPayloadInterface2 = _interopRequireDefault(_getPayloadInterface);

var _getPayloadFields = require('./getPayloadFields.js');

var _getPayloadFields2 = _interopRequireDefault(_getPayloadFields);

var _clientMutationId = require('./clientMutationId.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/**
 * Creates a mutation which will create a new row.
 *
 * @param {Table} table
 * @returns {GraphQLFieldConfig}
 */
const createInsertMutationField = table => ({
  type: createPayloadType(table),
  description: `Creates a new node of the ${ table.getMarkdownTypeName() } type.`,

  args: {
    input: {
      type: new _graphql.GraphQLNonNull(createInputType(table))
    }
  },

  resolve: resolveInsert(table)
});

exports['default'] = createInsertMutationField;


const createInputType = table => new _graphql.GraphQLInputObjectType({
  name: `Insert${ table.getTypeName() }Input`,
  description: `The ${ table.getMarkdownTypeName() } to insert.`,

  fields: _extends({}, (0, _lodash.fromPairs)(table.getColumns().map(column => [column.getFieldName(), {
    type: (column.hasDefault ? _graphql.getNullableType : _lodash.identity)((0, _getColumnType2['default'])(column)),
    description: column.description
  }])), {
    clientMutationId: _clientMutationId.inputClientMutationId
  })
});

const createPayloadType = table => new _graphql.GraphQLObjectType({
  name: `Insert${ table.getTypeName() }Payload`,
  description: `Contains the ${ table.getMarkdownTypeName() } node inserted by the mutation.`,
  interfaces: [(0, _getPayloadInterface2['default'])(table.schema)],

  fields: _extends({
    [table.getFieldName()]: {
      type: (0, _createTableType2['default'])(table),
      description: `The inserted ${ table.getMarkdownTypeName() }.`,
      resolve: _ref => {
        let output = _ref.output;
        return output;
      }
    },

    [`${ table.getFieldName() }Edge`]: {
      type: (0, _createConnectionType.createTableEdgeType)(table),
      args: {
        orderBy: {
          type: (0, _createConnectionArgs.createTableOrderingEnum)(table),
          description: 'The value by which the cursor is created so relay knows where to insert ' + 'the edge in the connection.',
          defaultValue: (() => {
            const column = table.getPrimaryKeys()[0];
            if (column) return column.name;
            return null;
          })()
        }
      },
      description: 'An edge to be inserted in a connection with help of the containing cursor.',
      resolve: (_ref2, _ref3) => {
        let output = _ref2.output;
        let orderBy = _ref3.orderBy;
        return {
          cursor: orderBy && output[orderBy],
          node: output
        };
      }
    }

  }, (0, _getPayloadFields2['default'])(table.schema))
});

const resolveInsert = table => {
  // Note that using `DataLoader` here would not make very minor performance
  // improvements because mutations are executed in sequence, not parallel.
  //
  // A better solution for batch inserts is a custom batch insert field.
  const columns = table.getColumns();

  return (() => {
    var _ref4 = _asyncToGenerator(function* (source, args, _ref5) {
      let client = _ref5.client;

      // Get the input object value from the args.
      const input = args.input;
      const clientMutationId = input.clientMutationId;


      const valueEntries = columns.map(function (column) {
        return [column, input[column.getFieldName()]];
      }).filter(function (_ref6) {
        var _ref7 = _slicedToArray(_ref6, 2);

        let value = _ref7[1];
        return value;
      });

      // Insert the thing making sure we return the newly inserted row.

      var _ref8 = yield client.queryAsync(new _SQLBuilder2['default']().add(`insert into ${ table.getIdentifier() }`).add(`(${ valueEntries.map(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 1);

        let column = _ref10[0];
        return `"${ column.name }"`;
      }).join(', ') })`).add('values').add(`(${ valueEntries.map((0, _lodash.constant)('$')).join(', ') })`, valueEntries.map(function (_ref11) {
        var _ref12 = _slicedToArray(_ref11, 2);

        let value = _ref12[1];
        return value;
      })).add('returning *'));

      var _ref8$rows = _slicedToArray(_ref8.rows, 1);

      const row = _ref8$rows[0];


      const output = row ? (row[_symbols.$$rowTable] = table, row) : null;

      return {
        output,
        clientMutationId
      };
    });

    return function (_x, _x2, _x3) {
      return _ref4.apply(this, arguments);
    };
  })();
};