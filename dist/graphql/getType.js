'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _pg = require('pg');

var _lodash = require('lodash');

var _createTableType = require('./createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _types = require('./types.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * A map of types where the PostgreSQL type is the key and the GraphQL type is
 * the value.
 *
 * In order to see available PostgreSQL types in your database run the
 * following query:
 *
 * ```sql
 * select typname, oid, typarray from pg_type where typtype = 'b' order by oid;
 * ```
 *
 * Also see the [`pg-types`][1] module’s source code to see what types they
 * are parsing.
 *
 * [1]: https://github.com/brianc/node-pg-types
 */
const postgresToGraphQLTypes = new Map([[20, _types.BigIntType], [21, _graphql.GraphQLInt], [23, _graphql.GraphQLInt], [26, _graphql.GraphQLInt], [700, _graphql.GraphQLFloat], [701, _graphql.GraphQLFloat], [16, _graphql.GraphQLBoolean], [1082, _types.DateType], [1114, _types.DateType], [1184, _types.DateType], [600, _types.PointType], [718, _types.CircleType], [1000, new _graphql.GraphQLList(_graphql.GraphQLBoolean)], [1005, new _graphql.GraphQLList(_graphql.GraphQLInt)], [1007, new _graphql.GraphQLList(_graphql.GraphQLInt)], [1028, new _graphql.GraphQLList(_graphql.GraphQLInt)], [1016, new _graphql.GraphQLList(_types.BigIntType)], [1021, new _graphql.GraphQLList(_graphql.GraphQLFloat)], [1022, new _graphql.GraphQLList(_graphql.GraphQLFloat)], [1231, new _graphql.GraphQLList(_graphql.GraphQLFloat)], [1014, new _graphql.GraphQLList(_graphql.GraphQLString)], [1015, new _graphql.GraphQLList(_graphql.GraphQLString)], [1008, new _graphql.GraphQLList(_graphql.GraphQLString)], [1009, new _graphql.GraphQLList(_graphql.GraphQLString)], [1115, new _graphql.GraphQLList(_types.DateType)], [1182, new _graphql.GraphQLList(_types.DateType)], [1185, new _graphql.GraphQLList(_types.DateType)], [1186, _types.IntervalType], [114, _types.JSONType], [3802, _types.JSONType], [199, new _graphql.GraphQLList(_types.JSONType)], [3807, new _graphql.GraphQLList(_types.JSONType)], [2951, new _graphql.GraphQLList(_graphql.GraphQLString)], [791, new _graphql.GraphQLList(_graphql.GraphQLString)], [1183, new _graphql.GraphQLList(_graphql.GraphQLString)], [1700, _graphql.GraphQLFloat], [2950, _types.UUIDType], [18, _graphql.GraphQLString], [25, _graphql.GraphQLString], [1043, _graphql.GraphQLString]]);

// Override custom type parsers.
// TODO: This is a temporary solution.
_pg.types.setTypeParser(600, String);
_pg.types.setTypeParser(718, String);
_pg.types.setTypeParser(1186, String);

/**
 * Gets a GraphQL type for a PostgreSQL type.
 *
 * @param {Column} column
 * @returns {GraphQLType}
 */
const getType = (0, _lodash.memoize)(type => {
  // If the type is an enum, let’s create an enum for it.
  if (type.isEnum) {
    return new _graphql.GraphQLEnumType({
      name: (0, _lodash.upperFirst)((0, _lodash.camelCase)(type.name)),
      description: type.description,
      values: (0, _lodash.fromPairs)(type.variants.map(variant => [(0, _lodash.toUpper)((0, _lodash.snakeCase)(variant)), { value: variant }]))
    });
  }

  // If the type is a domain, return the underlying type
  if (type.isDomain) return getType(type.baseType);

  // If this type is a table type, use the PostGraphQL table type.
  if (type.isTableType) return (0, _createTableType2['default'])(type.table);

  // Return internal type or a string.
  return postgresToGraphQLTypes.get(type.id) || _graphql.GraphQLString;
});

exports['default'] = getType;