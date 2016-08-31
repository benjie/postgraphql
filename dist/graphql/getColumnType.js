'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _graphql = require('graphql');

var _getType = require('./getType.js');

var _getType2 = _interopRequireDefault(_getType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const getColumnType = (0, _lodash.memoize)(_ref => {
  let isNullable = _ref.isNullable;
  let type = _ref.type;
  return isNullable ? (0, _getType2['default'])(type) : new _graphql.GraphQLNonNull((0, _getType2['default'])(type));
});

exports['default'] = getColumnType;