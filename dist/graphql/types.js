'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UUIDType = exports.IntervalType = exports.CircleType = exports.PointType = exports.DateType = exports.BigIntType = exports.JSONType = exports.PageInfoType = exports.CursorType = exports.NodeType = exports.fromID = exports.toID = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _graphql = require('graphql');

var _graphqlTypeJson = require('graphql-type-json');

var _graphqlTypeJson2 = _interopRequireDefault(_graphqlTypeJson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/* ============================================================================
 * Utilities
 * ========================================================================= */

const toBase64 = value => new Buffer(value.toString()).toString('base64');
const fromBase64 = value => new Buffer(value.toString(), 'base64').toString();

const createStringScalarType = _ref => {
  let name = _ref.name;
  let description = _ref.description;
  return new _graphql.GraphQLScalarType({
    name,
    description,
    serialize: String,
    parseValue: String,
    parseLiteral: ast => ast.kind === _graphql.Kind.STRING ? ast.value : null
  });
};

/* ============================================================================
 * Node Types
 * ========================================================================= */

const toID = exports.toID = (tableName, values) => toBase64(`${ tableName }:${ values.join(',') }`);

const fromID = exports.fromID = encodedString => {
  const string = fromBase64(encodedString);
  if (!string) throw new Error(`Invalid ID '${ encodedString }'.`);

  var _string$split = string.split(':', 2);

  var _string$split2 = _slicedToArray(_string$split, 2);

  const tableName = _string$split2[0];
  const valueString = _string$split2[1];

  if (!valueString) throw new Error(`Invalid ID '${ encodedString }'.`);
  const values = valueString.split(',');
  return { tableName, values };
};

const NodeType = exports.NodeType = new _graphql.GraphQLInterfaceType({
  name: 'Node',
  description: 'A single node object in the graph with a globally unique identifier.',
  fields: {
    id: {
      type: _graphql.GraphQLID,
      description: 'The `Node`’s globally unique identifier used to refetch the node.'
    }
  }
});

/* ============================================================================
 * Connection Types
 * ========================================================================= */

const serializeCursor = cursor => toBase64(JSON.stringify([cursor.primaryKey, cursor.value]));

const deserializeCursor = serializedCursor => {
  var _JSON$parse = JSON.parse(fromBase64(serializedCursor));

  var _JSON$parse2 = _slicedToArray(_JSON$parse, 2);

  const primaryKey = _JSON$parse2[0];
  const value = _JSON$parse2[1];

  return { primaryKey, value };
};

const CursorType = exports.CursorType = new _graphql.GraphQLScalarType({
  name: 'Cursor',
  description: 'An opaque base64 encoded string describing a location in a list of items.',
  serialize: serializeCursor,
  parseValue: deserializeCursor,
  parseLiteral: ast => ast.kind === _graphql.Kind.STRING ? deserializeCursor(ast.value) : null
});

const PageInfoType = exports.PageInfoType = new _graphql.GraphQLObjectType({
  name: 'PageInfo',
  description: 'Information about pagination in a connection.',
  fields: {
    hasNextPage: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLBoolean),
      description: 'Are there items after our result set to be queried?',
      resolve: _ref2 => {
        let hasNextPage = _ref2.hasNextPage;
        return hasNextPage;
      }
    },
    hasPreviousPage: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLBoolean),
      description: 'Are there items before our result set to be queried?',
      resolve: _ref3 => {
        let hasPreviousPage = _ref3.hasPreviousPage;
        return hasPreviousPage;
      }
    },
    startCursor: {
      type: CursorType,
      description: 'The cursor for the first item in the list.',
      resolve: _ref4 => {
        let startCursor = _ref4.startCursor;
        return startCursor;
      }
    },
    endCursor: {
      type: CursorType,
      description: 'The cursor for the last item in the list.',
      resolve: _ref5 => {
        let endCursor = _ref5.endCursor;
        return endCursor;
      }
    }
  }
});

/* ============================================================================
 * PostgreSQL Types
 * ========================================================================= */

exports.JSONType = _graphqlTypeJson2['default'];
const BigIntType = exports.BigIntType = createStringScalarType({
  name: 'BigInt',
  description: 'A signed eight-byte integer represented as a string'
});

const DateType = exports.DateType = createStringScalarType({
  name: 'Date',
  description: 'Some time value'
});

const PointType = exports.PointType = createStringScalarType({
  name: 'Point',
  description: 'A geometric point on a plane'
});

const CircleType = exports.CircleType = createStringScalarType({
  name: 'Circle',
  description: 'Some circle on a plane made of a point and a radius'
});

const IntervalType = exports.IntervalType = createStringScalarType({
  name: 'Interval',
  description: 'Some time span'
});

const UUIDType = exports.UUIDType = createStringScalarType({
  name: 'UUID',
  description: 'A universally unique identifier'
});