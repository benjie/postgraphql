'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getCatalog = require('./postgres/getCatalog.js');

var _getCatalog2 = _interopRequireDefault(_getCatalog);

var _createSchema = require('./graphql/createSchema.js');

var _createSchema2 = _interopRequireDefault(_createSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/**
 * Creates a GraphQL schema from a PostgreSQL config and a PostgreSQL schema
 * name.
 *
 * @param {Object} pgConfig
 * @param {string} schemaName
 * @returns {GraphQLSchema}
 */
const createGraphqlSchema = (() => {
  var _ref = _asyncToGenerator(function* (pgConfig, schemaName) {
    const pgCatalog = yield (0, _getCatalog2['default'])(pgConfig);
    const pgSchema = pgCatalog.getSchema(schemaName);
    if (!pgSchema) throw new Error(`No schema named '${ schemaName }' found.`);
    const graphqlSchema = (0, _createSchema2['default'])(pgSchema);
    return graphqlSchema;
  });

  return function createGraphqlSchema(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

exports['default'] = createGraphqlSchema;