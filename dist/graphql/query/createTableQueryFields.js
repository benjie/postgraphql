'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _createNodeQueryField = require('./createNodeQueryField.js');

var _createNodeQueryField2 = _interopRequireDefault(_createNodeQueryField);

var _createNodesQueryField = require('./createNodesQueryField.js');

var _createNodesQueryField2 = _interopRequireDefault(_createNodesQueryField);

var _createSingleQueryField = require('./createSingleQueryField.js');

var _createSingleQueryField2 = _interopRequireDefault(_createSingleQueryField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Creates the fields for a single table in the database. To see the type these
 * fields are used in and all the other fields exposed by a PostGraphQL query,
 * see `createQueryType`.
 *
 * @param {Table} table
 * @returns {GraphQLFieldConfig}
 */
const createTableQueryFields = table => {
  const fields = {};

  // `createSingleQueryField` may return `null`, so we must check for that.
  const nodeField = (0, _createNodeQueryField2['default'])(table);
  if (nodeField) fields[table.getFieldName()] = nodeField;

  for (const columns of table.getUniqueConstraints()) {
    const fieldName = `${ table.getFieldName() }By${ columns.map(column => (0, _lodash.upperFirst)(column.getFieldName())).join('And') }`;

    fields[fieldName] = (0, _createSingleQueryField2['default'])(table, columns);
  }

  fields[`${ table.getFieldName() }Nodes`] = (0, _createNodesQueryField2['default'])(table);

  return fields;
};

exports['default'] = createTableQueryFields;