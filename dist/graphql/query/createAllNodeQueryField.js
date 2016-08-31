'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _graphql = require('graphql');

var _symbols = require('../../symbols.js');

var _types = require('../types.js');

var _resolveTableSingle = require('../resolveTableSingle.js');

var _resolveTableSingle2 = _interopRequireDefault(_resolveTableSingle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createAllNodeQueryField = schema => {
  const getTable = (0, _lodash.memoize)(tableName => schema.catalog.getTable(schema.name, tableName));
  return {
    type: _types.NodeType,
    description: 'Fetches an object given its globally unique `ID`.',

    args: {
      id: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
        description: 'The `ID` of the node.'
      }
    },

    resolve: (source, args, context) => {
      const id = args.id;

      // If the id is just `viewer`, we are trying to refetch the viewer node.

      if (id === 'viewer') return { [_symbols.$$isViewer]: true };

      var _fromID = (0, _types.fromID)(id);

      const tableName = _fromID.tableName;
      const values = _fromID.values;

      const table = getTable(tableName);

      if (!table) throw new Error(`No table '${ tableName }' in schema '${ schema.name }'.`);

      return getResolveNode(table)({ values }, {}, context);
    }
  };
};

exports['default'] = createAllNodeQueryField;

// This function will be called for every resolution, therefore it is (and
// must be) memoized.
//
// Because this is memoized, fetching primary keys is ok here.

const getResolveNode = (0, _lodash.memoize)(table => (0, _resolveTableSingle2['default'])(table, table.getPrimaryKeys(), _ref => {
  let values = _ref.values;
  return values;
}));