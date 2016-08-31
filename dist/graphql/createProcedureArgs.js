'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _graphql = require('graphql');

var _getType = require('./getType.js');

var _getType2 = _interopRequireDefault(_getType);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const createProcedureArgs = function createProcedureArgs(procedure) {
  let omitArg = arguments.length <= 1 || arguments[1] === undefined ? (0, _lodash.constant)(false) : arguments[1];
  return (0, _lodash.fromPairs)(
  // For all of our argument types, make a key/value pair which will
  // eventually be transformed into a GraphQL argument object. We use the
  // name from `argNames` and the type from `argTypes` (we also assume they
  // are arrays of equal lengths). If the procedure is marked as strict, all
  // arguments also must be required.
  Array.from(procedure.args).filter(argEntry => !omitArg.apply(undefined, _toConsumableArray(argEntry))).map(_ref => {
    var _ref2 = _slicedToArray(_ref, 2);

    let name = _ref2[0];
    let type = _ref2[1];
    return [(0, _lodash.camelCase)(name), {
      type: procedure.isStrict ? new _graphql.GraphQLNonNull((0, _getType2['default'])(type)) : (0, _getType2['default'])(type)
    }];
  }));
};

exports['default'] = createProcedureArgs;