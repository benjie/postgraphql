'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGraphqlSchema = exports['default'] = undefined;

require('./promisify');

var _postgraphql = require('./postgraphql.js');

var _postgraphql2 = _interopRequireDefault(_postgraphql);

var _createGraphqlSchema2 = require('./createGraphqlSchema.js');

var _createGraphqlSchema3 = _interopRequireDefault(_createGraphqlSchema2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports['default'] = _postgraphql2['default'];
exports.createGraphqlSchema = _createGraphqlSchema3['default'];