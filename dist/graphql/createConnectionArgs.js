'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTableOrderingEnum = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphql = require('graphql');

var _types = require('./types.js');

var _getType = require('./getType.js');

var _getType2 = _interopRequireDefault(_getType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createConnectionArgs = function createConnectionArgs(table) {
  let ignoreColumnConditions = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  return _extends({
    // The column specified by `orderBy` means more than just the order to
    // return items in. This column is also the column we will use for
    // cursors.
    orderBy: {
      type: createTableOrderingEnum(table),
      description: 'The order the resulting items should be returned in. This argument ' + 'is also important as it is used in creating pagination cursors. This ' + 'value’s default is the primary key for the object.',
      defaultValue: (() => {
        const column = table.getPrimaryKeys()[0];
        if (column) return column.name;
        return null;
      })()
    },
    first: {
      type: _graphql.GraphQLInt,
      description: 'The top `n` items in the set to be returned. Can’t be used ' + 'with `last`.'
    },
    last: {
      type: _graphql.GraphQLInt,
      description: 'The bottom `n` items in the set to be returned. Can’t be used ' + 'with `first`.'
    },
    before: {
      type: _types.CursorType,
      description: 'Constrains the set to nodes *before* this cursor in the specified ordering.'
    },
    after: {
      type: _types.CursorType,
      description: 'Constrains the set to nodes *after* this cursor in the specified ordering.'
    },
    offset: {
      type: _graphql.GraphQLInt,
      description: 'An integer offset representing how many items to skip in the set.'
    },
    descending: {
      type: _graphql.GraphQLBoolean,
      description: 'If `true` the nodes will be in descending order, if `false` the ' + 'items will be in ascending order. `false` by default.',
      defaultValue: false
    }
  }, (0, _lodash.fromPairs)(table.getColumns()
  // If `ignoreColumnConditions` is set to true, all column conditions will
  // be disabled. If `ignoreColumnConditions` is an array, only certain
  // conditions will be ignored.
  .filter(column => ignoreColumnConditions === true ? false : !(0, _lodash.includes)(ignoreColumnConditions, column)).map(column => [column.getFieldName(), {
    type: (0, _getType2['default'])(column.type),
    description: 'Filters the resulting set with an equality test on the ' + `${ column.getMarkdownFieldName() } field.`
  }])));
};

// TODO: Deprecate this…
// deprecationReason:
//   'Simple equality testing is insufficient for the nodes field and just ' +
//   'adds noise. Instead use procedures for custom set filtering.',
exports['default'] = createConnectionArgs;

/**
 * Creates an ordering enum which simply contains all of a `Table`s columns.
 *
 * @param {Table} table
 * @returns {GraphQLEnumType}
 */
// TODO: Some way to eliminate some columns from ordering enum?

const createTableOrderingEnum = exports.createTableOrderingEnum = (0, _lodash.memoize)(table => new _graphql.GraphQLEnumType({
  name: `${ table.getTypeName() }Ordering`,
  description: `Properties with which ${ table.getMarkdownTypeName() } can be ordered.`,

  values: (0, _lodash.fromPairs)(table.getColumns().map(column => [(0, _lodash.toUpper)((0, _lodash.snakeCase)(column.getFieldName())), {
    value: column.name,
    description: column.description
  }]))
}));