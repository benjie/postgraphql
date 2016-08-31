'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphql = require('graphql');

var _symbols = require('../symbols.js');

var _types = require('./types');

var _createQueryFields = require('./query/createQueryFields.js');

var _createQueryFields2 = _interopRequireDefault(_createQueryFields);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createViewerField = (0, _lodash.memoize)(schema => ({
  type: new _graphql.GraphQLNonNull(new _graphql.GraphQLObjectType({
    name: 'Viewer',
    description: 'The viewer type, provides a “view” into your data. To be used with Relay.',
    interfaces: [_types.NodeType],
    isTypeOf: value => value[_symbols.$$isViewer],
    fields: _extends({}, (0, _createQueryFields2['default'])(schema), {
      id: {
        type: _graphql.GraphQLID,
        description: 'An identifier for the viewer node. Just the plain string “viewer.” ' + 'Can be used to refetch the viewer object in the `node` field. This ' + 'is required for Relay.',

        resolve: () => 'viewer'
      }
    })
  })),

  description: 'A single entry query for the advanced data client Relay. Nothing ' + 'special at all, if you don’t know what this field is for, you probably ' + 'don’t need it.',

  resolve: () => ({ [_symbols.$$isViewer]: true })
}));

exports['default'] = createViewerField;