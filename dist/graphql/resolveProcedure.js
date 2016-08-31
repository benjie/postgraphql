'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _symbols = require('../symbols.js');

var _createProcedureCall = require('./createProcedureCall.js');

var _createProcedureCall2 = _interopRequireDefault(_createProcedureCall);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function asPgValue(value) {
  const newValue = (0, _lodash.isArray)(value) ? `{${ value.map(i => JSON.stringify(i)).join(',') }}` : value;
  return newValue;
}

const resolveProcedure = (procedure, getProcedureArgs) => {
  // If this type is a table type, this variable will be a reference to that table.
  const returnTable = procedure.getReturnTable();
  const argEntries = Array.from(procedure.args);
  const procedureCall = (0, _createProcedureCall2['default'])(procedure);

  // Construct the query.
  //
  // If the procedure returns a table type let’s select all of its values
  // instead of just a tuple.
  const query = {
    name: `procedure_${ procedure.name }`,
    text: returnTable ? `select row_to_json(${ procedureCall }) as "output"` : `select ${ procedureCall } as "output"`
  };

  // Gets the output from a row returned by our query.
  const getOutput = _ref => {
    let output = _ref.output;

    if (!output) return null;

    // If we are returning a table, we need to make sure to add the row table
    // identifier property to our output object.
    if (returnTable) output[_symbols.$$rowTable] = returnTable;

    return output;
  };

  return (() => {
    var _ref2 = _asyncToGenerator(function* (source, args, _ref3) {
      let client = _ref3.client;

      const procedureArgs = getProcedureArgs(source, args);

      const values = argEntries.map(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 2);

        let name = _ref5[0];
        let type = _ref5[1];

        const obj = procedureArgs[(0, _lodash.camelCase)(name)];

        // See https://github.com/calebmer/postgraphql/pull/58
        if (type.isTableType) {
          (0, _lodash.mapValues)(obj, function (val, key) {
            obj[key] = asPgValue(val);
          });
        }

        return obj;
      });

      // Actuall run the procedure using our arguments.
      const result = yield client.queryAsync(_extends({}, query, { values }));

      // If the procedure returns a set, return all of the rows.
      if (procedure.returnsSet) return result.rows.map(getOutput);

      return getOutput(result.rows[0]);
    });

    return function (_x, _x2, _x3) {
      return _ref2.apply(this, arguments);
    };
  })();
};

exports['default'] = resolveProcedure;