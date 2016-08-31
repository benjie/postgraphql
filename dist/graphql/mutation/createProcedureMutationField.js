'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _graphql = require('graphql');

var _createProcedureReturnType = require('../createProcedureReturnType.js');

var _createProcedureReturnType2 = _interopRequireDefault(_createProcedureReturnType);

var _createProcedureArgs = require('../createProcedureArgs.js');

var _createProcedureArgs2 = _interopRequireDefault(_createProcedureArgs);

var _resolveProcedure = require('../resolveProcedure.js');

var _resolveProcedure2 = _interopRequireDefault(_resolveProcedure);

var _getPayloadInterface = require('./getPayloadInterface.js');

var _getPayloadInterface2 = _interopRequireDefault(_getPayloadInterface);

var _getPayloadFields = require('./getPayloadFields.js');

var _getPayloadFields2 = _interopRequireDefault(_getPayloadFields);

var _clientMutationId = require('./clientMutationId.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const createProcedureMutationField = procedure => ({
  type: createPayloadType(procedure),
  description: procedure.description,

  args: {
    input: {
      type: new _graphql.GraphQLNonNull(createInputType(procedure))
    }
  },

  resolve: (() => {
    var _ref = _asyncToGenerator(function* (source, args, context) {
      const input = args.input;
      const clientMutationId = input.clientMutationId;

      return {
        output: yield getResolveProcedure(procedure)(source, args, context),
        clientMutationId
      };
    });

    return function resolve(_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  })()
});

exports['default'] = createProcedureMutationField;


const createInputType = procedure => new _graphql.GraphQLInputObjectType({
  name: `${ (0, _lodash.upperFirst)((0, _lodash.camelCase)(procedure.name)) }Input`,
  description: `The input object for the ${ procedure.getMarkdownFieldName() } procedure.`,

  fields: _extends({}, (0, _createProcedureArgs2['default'])(procedure), {
    clientMutationId: _clientMutationId.inputClientMutationId
  })
});

const createPayloadType = procedure => new _graphql.GraphQLObjectType({
  name: `${ (0, _lodash.upperFirst)((0, _lodash.camelCase)(procedure.name)) }Payload`,
  description: `The payload returned by the ${ procedure.getMarkdownFieldName() }`,
  interfaces: [(0, _getPayloadInterface2['default'])(procedure.schema)],

  // Our payload has two fields, one is the return type. The name of which is
  // the type name, so a `Circle` would have a field name of `circle` and a
  // `Person` would have a field name of `person`. And the Relay required
  // `clientPayloadId` field.
  fields: _extends({
    output: {
      // Get the GraphQL return type for the procedure’s return type. If the
      // procedure is to return a set, we need to reflect that in our GraphQL type
      // as well.
      type: (0, _createProcedureReturnType2['default'])(procedure),
      description: `The actual value returned by ${ procedure.getMarkdownFieldName() }`,
      resolve: _ref2 => {
        let output = _ref2.output;
        return output;
      }
    }
  }, (0, _getPayloadFields2['default'])(procedure.schema))
});

const getResolveProcedure = (0, _lodash.memoize)(procedure => (0, _resolveProcedure2['default'])(procedure, (source, _ref3) => {
  let input = _ref3.input;
  return input;
}));