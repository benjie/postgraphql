'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createGraphqlSchema = require('./createGraphqlSchema.js');

var _createGraphqlSchema2 = _interopRequireDefault(_createGraphqlSchema);

var _createServer = require('./createServer.js');

var _createServer2 = _interopRequireDefault(_createServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * A nice interface for creating a PostGraphQL server.
 *
 * @param {string | Object} pgConfig
 * @param {string?} schemaName
 * @param {Object} options
 * @returns {Server}
 */
const postgraphql = (pgConfig, schemaName, options) => {
  if (typeof schemaName === 'object') {
    options = schemaName;
    schemaName = null;
  }

  // Default schema name is public.
  schemaName = schemaName || 'public';
  options = options || {};

  // `createServer` allows us to give it a promise for a `graphqlSchema`
  const graphqlSchema = (0, _createGraphqlSchema2['default'])(pgConfig, schemaName);

  return (0, _createServer2['default'])(_extends({}, options, {
    graphqlSchema,
    pgConfig
  }));
};

exports['default'] = postgraphql;