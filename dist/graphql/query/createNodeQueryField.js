'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _types = require('../types.js');

var _createTableType = require('../createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _resolveTableSingle = require('../resolveTableSingle.js');

var _resolveTableSingle2 = _interopRequireDefault(_resolveTableSingle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Creates an object field for selecting a single row of a table.
 *
 * @param {Table} table
 * @returns {GraphQLFieldConfig}
 */
const createNodeQueryField = table => {
  const primaryKeys = table.getPrimaryKeys();

  // Can’t query a single node of a table if it does not have a primary key.
  if (primaryKeys.length === 0) return null;

  return {
    type: (0, _createTableType2['default'])(table),
    description: `Queries a single ${ table.getMarkdownTypeName() } using its primary keys.`,

    args: {
      id: {
        type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
        description: `The \`ID\` of the ${ table.getMarkdownTypeName() } node.`
      }
    },

    resolve: (0, _resolveTableSingle2['default'])(table, primaryKeys, (source, _ref) => {
      let id = _ref.id;

      var _fromID = (0, _types.fromID)(id);

      const tableName = _fromID.tableName;
      const values = _fromID.values;

      if (tableName !== table.name) return null;
      return values;
    })
  };
};

exports['default'] = createNodeQueryField;