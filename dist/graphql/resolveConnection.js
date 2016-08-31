'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _symbols = require('../symbols.js');

var _SQLBuilder = require('../SQLBuilder.js');

var _SQLBuilder2 = _interopRequireDefault(_SQLBuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const resolveConnection = function resolveConnection(table) {
  let getExtraConditions = arguments.length <= 1 || arguments[1] === undefined ? (0, _lodash.constant)({}) : arguments[1];
  let getFromClause = arguments.length <= 2 || arguments[2] === undefined ? (0, _lodash.constant)(table.getIdentifier()) : arguments[2];

  const columns = table.getColumns();
  const primaryKey = table.getPrimaryKeys();

  return (source, args, _ref) => {
    let client = _ref.client;
    const orderByName = args.orderBy;
    const first = args.first;
    const last = args.last;
    const after = args.after;
    const before = args.before;
    const offset = args.offset;
    const descending = args.descending;

    const conditions = _objectWithoutProperties(args, ['orderBy', 'first', 'last', 'after', 'before', 'offset', 'descending']);

    // Add extra conditions to the leftover `conditions` argument.


    (0, _lodash.assign)(conditions, getExtraConditions(source, args));

    // Throw an error if `orderBy` is not defined.
    if (!orderByName) throw new Error('`orderBy` not defined in properties. `orderBy` is required for creating cursors.');

    // If both `first` and `last` are defined, throw an error.
    if (first && last) throw new Error('Cannot define both a `first` and a `last` argument.');

    // Get the column we are ordering by.
    const orderBy = columns.find(_ref2 => {
      let name = _ref2.name;
      return orderByName === name;
    });
    const fromClause = getFromClause(source, args);

    // Here we take the full primary key for our table and filter out columns
    // with the same name as the `orderBy`. This is because in some instances
    // of PostgreSQL (specifically 9.5beta1) an operation like
    // `(id, id) > (1, 1)` would *include* the row with an `id` of `1`. Even if
    // this bug were a beta bug, however, it still makes sense to dedupe a
    // comparison with a tuple like `(id, id)`.
    const primaryKeyNoOrderBy = primaryKey.filter(_ref3 => {
      let name = _ref3.name;
      return name !== orderBy.name;
    });

    // Get the cursor value for a row using the `orderBy` column.
    const getRowCursorValue = row => ({
      value: row[orderBy.name],
      primaryKey: primaryKeyNoOrderBy.map(_ref4 => {
        let name = _ref4.name;
        return row[name];
      })
    });

    // Transforms object keys (which are field names) into column names.
    const getWhereClause = (0, _lodash.once)(() => {
      const sql = new _SQLBuilder2['default']();

      // For all entries in the conditions object.
      for (const fieldName in conditions) {
        // Find the column for the field name and if there is no column, skip
        // this field.
        const column = columns.find(c => c.getFieldName() === (0, _lodash.camelCase)(fieldName));
        if (!column) continue;

        // Add to the SQL a condition with a trailing `and`.
        sql.add(`${ column.getIdentifier() } = $1 and`, [conditions[fieldName]]);
      }

      // Add true for both empty condition objects and the last trailing `and`.
      sql.add('true');

      return sql;
    });

    // Gets the condition for filtering our result set using a cursor.
    const getCursorCondition = (cursor, operator) => {
      const sql = new _SQLBuilder2['default']();

      const cursorCompareLHS = `(${ [orderBy.name].concat(_toConsumableArray(primaryKeyNoOrderBy.map(_ref5 => {
        let name = _ref5.name;
        return name;
      }))).map(name => `"${ name }"`).join(', ') })`;

      const cursorCompareRHS = `(${
      // Here we only want to create a string of placeholders: `$1, $2, $3`
      // etc. So we create an array of nulls of the appropriate length and
      // then use the index (`i`) to generate the actual placeholder.
      Array(1 + primaryKeyNoOrderBy.length).fill(null).map((x, i) => `$${ i + 1 }`).join(', ') })`;

      sql.add(`${ cursorCompareLHS } ${ operator } ${ cursorCompareRHS }`, [cursor.value].concat(_toConsumableArray(cursor.primaryKey)));

      return sql;
    };

    const getRows = (0, _lodash.once)(_asyncToGenerator(function* () {
      // Start our query.
      const sql = new _SQLBuilder2['default']().add('select * from').add(fromClause).add('where');

      // Add the conditions for `after` and `before` which will narrow our
      // range.
      if (before) sql.add(getCursorCondition(before, '<')).add('and');
      if (after) sql.add(getCursorCondition(after, '>')).add('and');

      // Add the conditions…
      sql.add(getWhereClause());

      // Create the ordering statement and add it to the query.
      // If a `last` argument was defined we are querying from the bottom so we
      // need to flip our order.
      const actuallyDescending = last ? !descending : descending;

      const orderings = [`"${ orderBy.name }" ${ actuallyDescending ? 'desc' : 'asc' }`].concat(_toConsumableArray(primaryKeyNoOrderBy.map(function (_ref7) {
        let name = _ref7.name;
        return `"${ name }" ${ last ? 'desc' : 'asc' }`;
      }))).join(', ');

      sql.add(`order by ${ orderings }`);

      // Set the correct range.
      if (first) sql.add('limit $1', [first]);
      if (last) sql.add('limit $1', [last]);
      if (offset) sql.add('offset $1', [offset]);

      // Run the query.

      var _ref8 = yield client.queryAsync(sql);

      let rows = _ref8.rows;

      // If a `last` argument was defined we flipped our query ordering (see
      // the above `ORDER BY` addition), so now we need to flip it back so the
      // user gets what they expected.

      if (last) rows = rows.reverse();

      // Add the row table property for every row so it can be identified.
      rows.forEach(function (row) {
        return row[_symbols.$$rowTable] = table;
      });

      return rows;
    }));

    const getStartCursor = (0, _lodash.once)(() => getRows().then(rows => {
      const row = rows[0];
      return row ? getRowCursorValue(row) : null;
    }));

    const getEndCursor = (0, _lodash.once)(() => getRows().then(rows => {
      const row = rows[rows.length - 1];
      return row ? getRowCursorValue(row) : null;
    }));

    // The properties are in getters so that they are lazy. If we don’t need a
    // thing, we don’t need to make associated requests until the getter is
    // called.
    //
    // Also, the `pageInfo` stuff is not nested in its own object because it
    // turns out that pattern just increases cyclomatic complexity for no good
    // reason.
    return {
      get hasNextPage() {
        return (
          // Get the `endCursor`. We will need it.
          getEndCursor().then(endCursor => {
            if (!endCursor) return false;
            return client.queryAsync(
            // Try to find one row with a greater cursor. If one exists
            // we know there is a next page.
            new _SQLBuilder2['default']().add('select null from').add(fromClause).add('where').add(getCursorCondition(endCursor, descending ? '<' : '>')).add('and').add(getWhereClause()).add('limit 1')).then(_ref9 => {
              let rowCount = _ref9.rowCount;
              return rowCount !== 0;
            });
          })
        );
      },

      get hasPreviousPage() {
        return (
          // Get the `startCursor`. We will need it.
          getStartCursor().then(startCursor => {
            if (!startCursor) return false;
            return client.queryAsync(
            // Try to find one row with a lesser cursor. If one exists
            // we know there is a previous page.
            new _SQLBuilder2['default']().add('select null from').add(fromClause).add('where').add(getCursorCondition(startCursor, descending ? '>' : '<')).add('and').add(getWhereClause()).add('limit 1')).then(_ref10 => {
              let rowCount = _ref10.rowCount;
              return rowCount !== 0;
            });
          })
        );
      },

      // Gets the first cursor in the resulting items.
      get startCursor() {
        return getStartCursor();
      },

      // Gets the last cursor in the resulting items.
      get endCursor() {
        return getEndCursor();
      },

      // Runs a SQL query to get the count for this query with the provided
      // condition. Also makes sure only the parsed count is returned.
      get totalCount() {
        // There is a possibility that `count` will be so big JavaScript can’t
        // parse it :|
        return client.queryAsync(new _SQLBuilder2['default']().add('select count(*) as count from').add(fromClause).add('where').add(getWhereClause())).then(_ref11 => {
          var _ref11$rows = _slicedToArray(_ref11.rows, 1);

          let count = _ref11$rows[0].count;
          return parseInt(count, 10);
        });
      },

      get nodes() {
        return getRows();
      },

      get edges() {
        // Returns the rows with a generated `cursor` field for more details.
        return getRows().then(rows => rows.map(row => ({
          cursor: getRowCursorValue(row),
          node: row
        })));
      }
    };
  };
};

exports['default'] = resolveConnection;