'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphql = require('graphql');

var _createInsertMutationField = require('./createInsertMutationField.js');

var _createInsertMutationField2 = _interopRequireDefault(_createInsertMutationField);

var _createUpdateMutationField = require('./createUpdateMutationField.js');

var _createUpdateMutationField2 = _interopRequireDefault(_createUpdateMutationField);

var _createDeleteMutationField = require('./createDeleteMutationField.js');

var _createDeleteMutationField2 = _interopRequireDefault(_createDeleteMutationField);

var _createProcedureMutationField = require('./createProcedureMutationField.js');

var _createProcedureMutationField2 = _interopRequireDefault(_createProcedureMutationField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createMutationType = schema => new _graphql.GraphQLObjectType({
  name: 'Mutation',
  description: 'The entry type for GraphQL mutations.',
  fields: _extends({}, (0, _lodash.fromPairs)(schema.getProcedures().filter(_ref => {
    let isMutation = _ref.isMutation;
    return isMutation;
  }).filter(procedure => !procedure.hasTableArg()).map(procedure => [procedure.getFieldName(), (0, _createProcedureMutationField2['default'])(procedure)])), schema.getTables().map(table => createMutationFields(table)).reduce((0, _lodash.ary)(_lodash.assign, 2), {}))
});

exports['default'] = createMutationType;


const createMutationFields = table => {
  const mutations = {};

  if (table.isInsertable) mutations[`insert${ (0, _lodash.upperFirst)((0, _lodash.camelCase)(table.name)) }`] = (0, _createInsertMutationField2['default'])(table);
  if (table.isUpdatable) mutations[`update${ (0, _lodash.upperFirst)((0, _lodash.camelCase)(table.name)) }`] = (0, _createUpdateMutationField2['default'])(table);
  if (table.isDeletable) mutations[`delete${ (0, _lodash.upperFirst)((0, _lodash.camelCase)(table.name)) }`] = (0, _createDeleteMutationField2['default'])(table);

  return mutations;
};