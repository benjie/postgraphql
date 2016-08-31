'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

const createProcedureCall = procedure => {
  // Construct the qualified procedure name.
  const procedureName = `"${ procedure.schema.name }"."${ procedure.name }"`;

  // Construct the argument list for the procedure call.
  const procedureArgsList = Array.from(procedure.args).map((_ref, i) => {
    var _ref2 = _slicedToArray(_ref, 2);

    let name = _ref2[0];
    let type = _ref2[1];

    const placeholder = `$${ i + 1 }`;

    // If the type of this argument is a table type, we will be expecting JSON
    // but we need that JSON to be a table. Therefore we run it through
    // `json_populate_record`.
    if (type.isTableType) return `json_populate_record(null::"${ type.table.schema.name }"."${ type.table.name }", ${ placeholder })`;

    return placeholder;
  }).join(', ');

  // Add the procedure name with the procedure argument list.
  const procedureCall = `${ procedureName }(${ procedureArgsList })`;

  return procedureCall;
};

exports['default'] = createProcedureCall;