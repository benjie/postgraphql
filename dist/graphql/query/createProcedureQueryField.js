'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _createConnectionType = require('../createConnectionType.js');

var _createConnectionType2 = _interopRequireDefault(_createConnectionType);

var _createProcedureReturnType = require('../createProcedureReturnType.js');

var _createProcedureReturnType2 = _interopRequireDefault(_createProcedureReturnType);

var _createProcedureArgs = require('../createProcedureArgs.js');

var _createProcedureArgs2 = _interopRequireDefault(_createProcedureArgs);

var _createConnectionArgs = require('../createConnectionArgs.js');

var _createConnectionArgs2 = _interopRequireDefault(_createConnectionArgs);

var _createProcedureCall = require('../createProcedureCall.js');

var _createProcedureCall2 = _interopRequireDefault(_createProcedureCall);

var _resolveProcedure = require('../resolveProcedure.js');

var _resolveProcedure2 = _interopRequireDefault(_resolveProcedure);

var _resolveConnection = require('../resolveConnection.js');

var _resolveConnection2 = _interopRequireDefault(_resolveConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const createProcedureQueryField = procedure => {
  const argEntries = Array.from(procedure.args);
  const returnTable = procedure.getReturnTable();

  const procedureArgs = (0, _createProcedureArgs2['default'])(procedure);

  // If this is a connection, return a completely different field…
  if (procedure.returnsSet && returnTable) {
    return {
      type: (0, _createConnectionType2['default'])(returnTable),
      description: procedure.description,

      args: _extends({}, procedureArgs, (0, _createConnectionArgs2['default'])(returnTable, true)),

      resolve: (0, _resolveConnection2['default'])(returnTable, (0, _lodash.constant)({}), (source, args) => ({
        text: (0, _createProcedureCall2['default'])(procedure),
        values: argEntries.map(_ref => {
          var _ref2 = _slicedToArray(_ref, 1);

          let name = _ref2[0];
          return args[(0, _lodash.camelCase)(name)];
        })
      }))
    };
  }

  return {
    type: (0, _createProcedureReturnType2['default'])(procedure),
    description: procedure.description,
    args: procedureArgs,

    resolve: (0, _resolveProcedure2['default'])(procedure, (source, args) => args)
  };
};

exports['default'] = createProcedureQueryField;