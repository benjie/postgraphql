'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _graphql = require('graphql');

var _getType = require('./getType');

var _getType2 = _interopRequireDefault(_getType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createProcedureReturnType = (0, _lodash.memoize)(procedure => {
  const returnType = (0, _getType2['default'])(procedure.returnType);
  return procedure.returnsSet ? new _graphql.GraphQLList(returnType) : returnType;
});

exports['default'] = createProcedureReturnType;