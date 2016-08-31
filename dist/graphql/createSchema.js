'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _createQueryType = require('./query/createQueryType.js');

var _createQueryType2 = _interopRequireDefault(_createQueryType);

var _createMutationType = require('./mutation/createMutationType.js');

var _createMutationType2 = _interopRequireDefault(_createMutationType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Creates a GraphQLSchema from a PostgreSQL schema.
 *
 * @param {Schema} schema
 * @returns {GrpahQLSchema}
 */
const createGraphqlSchema = schema => new _graphql.GraphQLSchema({
  query: (0, _createQueryType2['default'])(schema),
  mutation: (0, _createMutationType2['default'])(schema)
});

exports['default'] = createGraphqlSchema;