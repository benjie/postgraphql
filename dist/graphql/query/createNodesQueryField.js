'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createConnectionType = require('../createConnectionType.js');

var _createConnectionType2 = _interopRequireDefault(_createConnectionType);

var _createConnectionArgs = require('../createConnectionArgs.js');

var _createConnectionArgs2 = _interopRequireDefault(_createConnectionArgs);

var _resolveConnection = require('../resolveConnection.js');

var _resolveConnection2 = _interopRequireDefault(_resolveConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Gets the Relay connection specification compliant list field for a `Table`.
 *
 * @param {Table} table
 * @returns {GraphQLFieldConfig}
 */
const createNodesQueryField = table => ({
  // Make sure the type of this field is our connection type. This connection
  // type will expect functions (that cache their values) and not traditional
  // values. This improves performance when we don’t have to do potentially
  // expensive queries on fields we don’t actually need.
  type: (0, _createConnectionType2['default'])(table),

  description: 'Queries and returns a set of items with some metatadata for ' + `${ table.getMarkdownTypeName() }. Note that cursors will not work ` + 'across different `orderBy` values. If you want to reuse a cursor, make ' + 'sure you don’t change `orderBy`.',

  args: (0, _createConnectionArgs2['default'])(table),

  resolve: (0, _resolveConnection2['default'])(table)
});

exports['default'] = createNodesQueryField;