'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _createViewerField = require('../createViewerField.js');

var _createViewerField2 = _interopRequireDefault(_createViewerField);

var _clientMutationId = require('./clientMutationId.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const getPayloadFields = (0, _lodash.memoize)(schema => ({
  clientMutationId: _clientMutationId.payloadClientMutationId,
  viewer: (0, _createViewerField2['default'])(schema)
}));

exports['default'] = getPayloadFields;