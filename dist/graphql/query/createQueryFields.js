'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _createAllNodeQueryField = require('./createAllNodeQueryField.js');

var _createAllNodeQueryField2 = _interopRequireDefault(_createAllNodeQueryField);

var _createTableQueryFields = require('./createTableQueryFields.js');

var _createTableQueryFields2 = _interopRequireDefault(_createTableQueryFields);

var _createProcedureQueryField = require('./createProcedureQueryField.js');

var _createProcedureQueryField2 = _interopRequireDefault(_createProcedureQueryField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createQueryFields = (0, _lodash.memoize)(schema => _extends({
  // Add the node query field.
  node: (0, _createAllNodeQueryField2['default'])(schema)
}, (0, _lodash.fromPairs)(schema.getProcedures().filter(_ref => {
  let isMutation = _ref.isMutation;
  return !isMutation;
}).filter(procedure => !procedure.hasTableArg()).map(procedure => [procedure.getFieldName(), (0, _createProcedureQueryField2['default'])(procedure)])), schema.getTables().map(table => (0, _createTableQueryFields2['default'])(table)).reduce((0, _lodash.ary)(_lodash.assign, 2), {})));

exports['default'] = createQueryFields;