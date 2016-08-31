'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTableEdgeType = undefined;

var _graphql = require('graphql');

var _lodash = require('lodash');

var _createTableType = require('./createTableType.js');

var _createTableType2 = _interopRequireDefault(_createTableType);

var _types = require('./types.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createTableConnectionType = (0, _lodash.memoize)(table => new _graphql.GraphQLObjectType({
  name: `${ table.getTypeName() }Connection`,
  description: `A connection to a list of ${ table.getMarkdownTypeName() } items`,

  // TODO: Implement a `ConnectionType` interface

  fields: {
    pageInfo: {
      type: new _graphql.GraphQLNonNull(_types.PageInfoType),
      description: `Information to aid in pagination of type ${ table.getMarkdownTypeName() }.`,
      resolve: pageInfo => pageInfo
    },
    totalCount: {
      type: _graphql.GraphQLInt,
      description: 'All of the items available to be queried in this connection.',
      resolve: _ref => {
        let totalCount = _ref.totalCount;
        return totalCount;
      }
    },
    nodes: {
      type: new _graphql.GraphQLList((0, _createTableType2['default'])(table)),
      description: `The queried list of ${ table.getMarkdownTypeName() }.`,
      resolve: _ref2 => {
        let nodes = _ref2.nodes;
        return nodes;
      }
    },
    edges: {
      type: new _graphql.GraphQLList(createTableEdgeType(table)),
      description: 'A single item and a cursor to aid in pagination.',
      resolve: _ref3 => {
        let edges = _ref3.edges;
        return edges;
      }
    }
  }
}));

exports['default'] = createTableConnectionType;
const createTableEdgeType = exports.createTableEdgeType = (0, _lodash.memoize)(table => new _graphql.GraphQLObjectType({
  name: `${ table.getTypeName() }Edge`,
  description: `An edge in the \`${ table.getTypeName() }Connection\`.`,

  fields: {
    cursor: {
      type: new _graphql.GraphQLNonNull(_types.CursorType),
      description: 'The cursor describing the position of the edge’s associated node.',
      resolve: _ref4 => {
        let cursor = _ref4.cursor;
        return cursor || 'null';
      }
    },
    node: {
      type: (0, _createTableType2['default'])(table),
      description: 'The item at the end of the edge.',
      resolve: _ref5 => {
        let node = _ref5.node;
        return node;
      }
    }
  }
}));