'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _dataloader = require('dataloader');

var _dataloader2 = _interopRequireDefault(_dataloader);

var _symbols = require('../symbols.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/**
 * Creates a resolver for querying a single value.
 *
 * The last parameter, `getColumnValues` is a function which gets `source` and
 * `args` and returns values for each of the second argument’s columns.
 *
 * @param {Table} table - The table we will be selecting from.
 * @param {Column[]} columns - The columns which will be filtered against.
 * @param {Function} getColumnValues - A function to get values for columns.
 * @returns {Function} - A function to be fed into `resolve`.
 */
const resolveTableSingle = (table, columns, getColumnValues) => {
  if (columns.length === 0) throw new Error('To resolve a single row, some columns must be used.');

  const primaryKeyMatch = `(${ columns.map(column => `"${ column.table.schema.name }"."${ column.table.name }"."${ column.name }"`).join(' || \',\' || ') })`;

  // We aren’t using the `sql` module here because the most efficient way to
  // run this query is with the `= any (…)` field. This feature is PostgreSQL
  // specific and can’t be done with `sql`.
  const query = {
    name: `${ table.schema.name }_${ table.name }_single_${ columns.map(column => column.name).join('_') }`,
    text: `select * from "${ table.schema.name }"."${ table.name }" where ${ primaryKeyMatch } = any ($1)`
  };

  // Because we don’t want to run 30+ SQL queries to fetch single rows if we
  // are fetching relations for a list, we optimize with a `DataLoader`.
  //
  // Note that there is a performance penalty in that if we are selecting 100+
  // rows we will have to run an aggregate `find` method for each row that was
  // queried. However, this is still much better than running 100+ SQL queries.
  // In addition, if we are selecting a lot of repeats, we can memoize this
  // operation.
  //
  // This is a memoized function because we don’t have another way of
  // accessing `client` which is local to the resolution context.
  const getDataLoader = (0, _lodash.memoize)(client => new _dataloader2['default']((() => {
    var _ref = _asyncToGenerator(function* (columnValueses) {
      // Query the client with our list of column values and prepared query.
      // Results can be returned in any order.

      // We expect to pass an array of strings with concatenated values.
      const values = [columnValueses.map(function (columnValues) {
        return columnValues.join(',') || null;
      })];

      var _ref2 = yield client.queryAsync(_extends({}, query, { values }));

      const rowCount = _ref2.rowCount;
      const rows = _ref2.rows;

      // Gets the row from the result set given a few column values.

      let getRow = function getRow(columnValues) {
        return rows.find(function (row) {
          return (0, _lodash.every)(columns.map(function (_ref3, i) {
            let name = _ref3.name;
            return String(row[name]) === String(columnValues[i]);
          }));
        });
      };

      // If there are 25% less values in our result set then this means there are
      // some duplicates and memoizing `getRow` could cause some performance gains.
      //
      // Note that this memoization should be tinkered with in the future to
      // determine the best memoization tradeoffs.
      if (columnValueses.length * 0.75 >= rowCount) getRow = (0, _lodash.memoize)(getRow, function (columnValues) {
        return columnValues.join(',');
      });

      return columnValueses.map(getRow);
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  })()));

  // Make sure we use a `WeakMap` for the cache so old `Client`s are not held
  // in memory.
  getDataLoader.cache = new WeakMap();

  return (() => {
    var _ref4 = _asyncToGenerator(function* (source, args, _ref5) {
      let client = _ref5.client;

      const values = getColumnValues(source, args);
      if (!values) return null;
      const row = yield getDataLoader(client).load(values);
      if (!row) return row;
      row[_symbols.$$rowTable] = table;
      return row;
    });

    return function (_x2, _x3, _x4) {
      return _ref4.apply(this, arguments);
    };
  })();
};

exports['default'] = resolveTableSingle;