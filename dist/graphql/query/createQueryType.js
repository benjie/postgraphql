'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _graphql = require('graphql');

var _createViewerField = require('../createViewerField.js');

var _createViewerField2 = _interopRequireDefault(_createViewerField);

var _createQueryFields = require('./createQueryFields.js');

var _createQueryFields2 = _interopRequireDefault(_createQueryFields);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Creates the Query type for the entire schema. To see the fields created for
 * singular tables refer to `createQueryFields`.
 *
 * @param {Schema} schema
 * @returns {GraphQLObjectType}
 */
const createQueryType = schema => new _graphql.GraphQLObjectType({
  name: 'Query',
  description: schema.description || 'The entry type for GraphQL queries.',
  fields: _extends({}, (0, _createQueryFields2['default'])(schema), {
    viewer: (0, _createViewerField2['default'])(schema)
  })
});

exports['default'] = createQueryType;