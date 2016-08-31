'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _graphql = require('graphql');

var _createViewerField = require('../createViewerField.js');

var _createViewerField2 = _interopRequireDefault(_createViewerField);

var _clientMutationId = require('./clientMutationId.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const getPayloadInterface = (0, _lodash.memoize)(schema => new _graphql.GraphQLInterfaceType({
  name: 'Payload',
  description: 'The payload of any mutation which contains a few important fields.',

  // We really don’t care about resolving a payload’s type, so just return null.
  resolveType: () => null,

  fields: {
    clientMutationId: _clientMutationId.payloadClientMutationId,
    viewer: (0, _createViewerField2['default'])(schema)
  }
}));

exports['default'] = getPayloadInterface;