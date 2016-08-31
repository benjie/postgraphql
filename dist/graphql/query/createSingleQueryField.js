'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _graphql = require('graphql');

var _createTableType = require('../createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _getColumnType = require('../getColumnType.js');

var _getColumnType2 = _interopRequireDefault(_getColumnType);

var _resolveTableSingle = require('../resolveTableSingle.js');

var _resolveTableSingle2 = _interopRequireDefault(_resolveTableSingle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createSingleQueryField = (table, columns) => ({
  type: (0, _createTableType2['default'])(table),
  description: `Queries a single ${ table.getMarkdownTypeName() } using a uniqueness ` + `constraint with field${ columns.length === 1 ? '' : 's' } ` + `${ columns.map(column => column.getMarkdownFieldName()).join(', ') }.`,

  args: (0, _lodash.fromPairs)(columns.map(column => [column.getFieldName(), {
    type: new _graphql.GraphQLNonNull((0, _graphql.getNullableType)((0, _getColumnType2['default'])(column))),
    description: `The exact value of the ${ column.getMarkdownFieldName() } field to match.`
  }])),

  resolve: (0, _resolveTableSingle2['default'])(table, columns, (source, args) => columns.map(column => args[column.getFieldName()]))
});

exports['default'] = createSingleQueryField;