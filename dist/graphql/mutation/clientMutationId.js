'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.payloadClientMutationId = exports.inputClientMutationId = undefined;

var _graphql = require('graphql');

const inputClientMutationId = exports.inputClientMutationId = {
  type: _graphql.GraphQLString,
  description: 'An optional mutation ID for client’s to use in tracking mutations. ' + 'This field has no meaning to the server and is simply returned as ' + 'is.'
};

const payloadClientMutationId = exports.payloadClientMutationId = {
  type: _graphql.GraphQLString,
  description: 'If the mutation was passed a `clientMutationId` in the input object this ' + 'is the exact same value echoed back.',
  resolve: _ref => {
    let clientMutationId = _ref.clientMutationId;
    return clientMutationId;
  }
};