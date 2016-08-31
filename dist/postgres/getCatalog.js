'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _catalog = require('./catalog.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const withClient = fn => (() => {
  var _ref = _asyncToGenerator(function* (pgConfig) {
    const client = yield _pg2['default'].connectAsync(pgConfig);
    const result = yield fn(client);
    client.end();
    return result;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Gets an instance of `Catalog` for the given PostgreSQL configuration.
 *
 * @param {Object} pgConfig
 * @returns {Catalog}
 */
const getCatalog = withClient((() => {
  var _ref2 = _asyncToGenerator(function* (client) {
    const catalog = new _catalog.Catalog();

    // Not all function calls can be parallelized, because some calls have
    // dependencies on one another. This should probably be cleaned up at some
    // point…

    yield addSchemas(client, catalog);
    yield addTables(client, catalog);

    yield Promise.all([addEnumTypes(client, catalog), addTableTypes(client, catalog), addDomainTypes(client, catalog)]);

    yield addColumns(client, catalog);

    yield Promise.all([addForeignKeys(client, catalog), addUniqueConstraints(client, catalog), addProcedures(client, catalog)]);

    return catalog;
  });

  return function (_x2) {
    return _ref2.apply(this, arguments);
  };
})());

exports['default'] = getCatalog;


const addSchemas = (client, catalog) => client.queryAsync(`
    select
      n.nspname as "name",
      d.description as "description"
    from
      pg_catalog.pg_namespace as n
      left join pg_catalog.pg_description as d on d.objoid = n.oid and d.objsubid = 0
    where
      n.nspname not in ('pg_catalog', 'information_schema');
  `).then(_ref3 => {
  let rows = _ref3.rows;
  return rows;
}).map(row => new _catalog.Schema(_extends({}, row, { catalog }))).each(schema => catalog.addSchema(schema));

const addTables = (client, catalog) =>
/* eslint-disable */
// Determine any views or other objects that we cannot mutate with
// pg_relation_is_updatable, more info:
// https://www.postgresql.org/message-id/CAEZATCV2_qN9P3zbvADwME_TkYf2gR_X2cLQR4R+pqkwxGxqJg@mail.gmail.com
// https://github.com/postgres/postgres/blob/2410a2543e77983dab1f63f48b2adcd23dba994e/src/backend/utils/adt/misc.c#L684
// https://github.com/postgres/postgres/blob/3aff33aa687e47d52f453892498b30ac98a296af/src/backend/rewrite/rewriteHandler.c#L2351
/* eslint-enable */
client.queryAsync(`
    select
      n.nspname as "schemaName",
      c.relname as "name",
      d.description as "description",
      case when
           (pg_catalog.pg_relation_is_updatable(c.oid, true)::bit(8) & B'00010000') = B'00010000'
           then true
           else false
      end as "isInsertable",
      case when
           (pg_catalog.pg_relation_is_updatable(c.oid, true)::bit(8) & B'00001000') = B'00001000'
           then true
           else false
      end as "isUpdatable",
      case when
           (pg_catalog.pg_relation_is_updatable(c.oid, true)::bit(8) & B'00000100') = B'00000100'
           then true
           else false
      end as "isDeletable"
    from
      pg_catalog.pg_class as c
      left join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
      left join pg_catalog.pg_description as d on d.objoid = c.oid and d.objsubid = 0
    where
      n.nspname not in ('pg_catalog', 'information_schema') and
      c.relkind in ('r', 'v', 'm', 'f');
  `).then(_ref4 => {
  let rows = _ref4.rows;
  return rows;
}).map(row => new _catalog.Table(_extends({}, row, {
  schema: catalog.getSchema(row.schemaName)
}))).each(table => catalog.addTable(table));

const addColumns = (client, catalog) => client.queryAsync(`
    select
      n.nspname as "schemaName",
      c.relname as "tableName",
      a.attname as "name",
      d.description as "description",
      a.attnum as "num",
      a.atttypid as "typeId",
      not(a.attnotnull) as "isNullable",
      cp.oid is not null as "isPrimaryKey",
      a.atthasdef as "hasDefault"
    from
      pg_catalog.pg_attribute as a
      left join pg_catalog.pg_class as c on c.oid = a.attrelid
      left join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
      left join pg_catalog.pg_description as d on d.objoid = c.oid and d.objsubid = a.attnum
      left join pg_catalog.pg_constraint as cp on
        cp.contype = 'p' and
        cp.conrelid = a.attrelid and
        cp.conkey::int[] @> array[a.attnum::int]
    where
      n.nspname not in ('pg_catalog', 'information_schema') and
      c.relkind in ('r', 'v', 'm', 'f') and
      a.attnum > 0 and
      not a.attisdropped
    order by
      n.nspname, c.relname, a.attnum;
  `).then(_ref5 => {
  let rows = _ref5.rows;
  return rows;
}).map(row => new _catalog.Column(_extends({}, row, {
  table: catalog.getTable(row.schemaName, row.tableName),
  type: catalog.getType(row.typeId)
}))).each(column => catalog.addColumn(column));

const addEnumTypes = (client, catalog) => client.queryAsync(`
    select
      t.oid as "id",
      n.nspname as "schemaName",
      t.typname as "name",
      array(
        select
          e.enumlabel::text
        from
          pg_catalog.pg_enum as e
        where
          e.enumtypid = t.oid
      ) as "variants"
    from
      pg_catalog.pg_type as t
      left join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
    where
      n.nspname not in ('pg_catalog', 'information_schema') and
      t.typtype = 'e';
  `).then(_ref6 => {
  let rows = _ref6.rows;
  return rows;
}).map(row => new _catalog.Enum(_extends({}, row, {
  schema: catalog.getSchema(row.schemaName)
}))).each(type => catalog.addEnum(type));

const addTableTypes = (client, catalog) => client.queryAsync(`
    select
      t.oid as "id",
      n.nspname as "schemaName",
      c.relname as "tableName"
    from
      pg_catalog.pg_type as t
      left join pg_catalog.pg_class as c on c.oid = t.typrelid
      left join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where
      n.nspname not in ('pg_catalog', 'information_schema') and
      c.relkind in ('r', 'v', 'm', 'f');
  `).then(_ref7 => {
  let rows = _ref7.rows;
  return rows;
}).map(row => new _catalog.TableType(_extends({}, row, {
  table: catalog.getTable(row.schemaName, row.tableName)
}))).each(type => catalog.addType(type));

const addDomainTypes = (client, catalog) => client.queryAsync(`
      with recursive domains as (
        -- select all user defined domains
          select
            t.oid as "id",
            n.nspname as "schemaName",
            t.typname as "name",
            t.typbasetype as "baseType",
            t.typtype as "typtype"
          from
            pg_catalog.pg_type as t
            left join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
          where
            n.nspname not in ('pg_catalog', 'information_schema')
            and t.typtype in ('d')
      ),
      builtin_types as (
        -- select all builtin types
          select
            t.oid as "id",
            n.nspname as "schemaName",
            t.typname as "name",
            t.typbasetype as "baseType",
            t.typtype as "typtype"
          from
            pg_catalog.pg_type as t
            left join pg_catalog.pg_namespace as n on n.oid = t.typnamespace
          where
            n.nspname not in ('information_schema')
            and t.typtype in ('b')
      ),
      domain_or_builtin_type as (
          select *, false as is_builtin
          from domains
            union all
          select *, true as is_builtin
          from builtin_types
      ),
      domains_resolved_basetype as (
        -- begin recursion with user defined domains
        -- each iteration joins to domain_or_builtin_type until we reach a builtin type
        select
          domains."id",
          domains."schemaName",
          domains."name",
          domains."baseType",
          domains."typtype" as "iter_typtype",
          domains."baseType" as "iter_baseType"
        from domains
        join domain_or_builtin_type on domain_or_builtin_type."id" = domains."baseType"
          union all
        select
          domains_resolved_basetype."id",
          domains_resolved_basetype."schemaName",
          domains_resolved_basetype."name",
          domain_or_builtin_type."baseType",
          domain_or_builtin_type."typtype" as "iter_typtype",
          domain_or_builtin_type."id" as "iter_baseType"
        from domains_resolved_basetype
        join domain_or_builtin_type on domain_or_builtin_type."id" = domains_resolved_basetype."baseType"
      )
      select
        "id",
        "schemaName",
        "name",
        "iter_baseType" as "baseType"
      from domains_resolved_basetype
      where "iter_typtype" = 'b';
    `).then(_ref8 => {
  let rows = _ref8.rows;
  return rows;
}).map(row => new _catalog.Domain(_extends({}, row, {
  baseType: new _catalog.Type(row.baseType),
  schema: catalog.getSchema(row.schemaName)
}))).each(type => catalog.addType(type));

const addForeignKeys = (client, catalog) => client.queryAsync(`
    select
      nn.nspname as "nativeSchemaName",
      cn.relname as "nativeTableName",
      c.conkey as "nativeColumnNums",
      nf.nspname as "foreignSchemaName",
      cf.relname as "foreignTableName",
      c.confkey as "foreignColumnNums"
    from
      pg_catalog.pg_constraint as c
      left join pg_catalog.pg_class as cn on cn.oid = c.conrelid
      left join pg_catalog.pg_class as cf on cf.oid = c.confrelid
      left join pg_catalog.pg_namespace as nn on nn.oid = cn.relnamespace
      left join pg_catalog.pg_namespace as nf on nf.oid = cf.relnamespace
    where
      nn.nspname not in ('pg_catalog', 'information_schema') and
      nf.nspname not in ('pg_catalog', 'information_schema') and
      c.contype = 'f'
    order by
      nn.nspname, cn.relname, nf.nspname, cf.relname, c.conkey, c.confkey;
  `).then(_ref9 => {
  let rows = _ref9.rows;
  return rows;
}).map(_ref10 => {
  let nativeSchemaName = _ref10.nativeSchemaName;
  let nativeTableName = _ref10.nativeTableName;
  let nativeColumnNums = _ref10.nativeColumnNums;
  let foreignSchemaName = _ref10.foreignSchemaName;
  let foreignTableName = _ref10.foreignTableName;
  let foreignColumnNums = _ref10.foreignColumnNums;

  const nativeTable = catalog.getTable(nativeSchemaName, nativeTableName);
  const foreignTable = catalog.getTable(foreignSchemaName, foreignTableName);
  const nativeColumns = nativeTable.getColumns();
  const foreignColumns = foreignTable.getColumns();
  return new _catalog.ForeignKey({
    nativeTable,
    foreignTable,
    nativeColumns: nativeColumnNums.map(colNum => nativeColumns.find(_ref11 => {
      let num = _ref11.num;
      return num === colNum;
    })),
    foreignColumns: foreignColumnNums.map(colNum => foreignColumns.find(_ref12 => {
      let num = _ref12.num;
      return num === colNum;
    }))
  });
}).each(foreignKey => catalog.addForeignKey(foreignKey));

const addUniqueConstraints = (client, catalog) => client.queryAsync(`
    select
      n.nspname as "schemaName",
      t.relname as "tableName",
      c.conkey as "columnNums"
    from
      pg_catalog.pg_constraint as c
      left join pg_catalog.pg_class as t on t.oid = c.conrelid
      left join pg_catalog.pg_namespace as n on n.oid = t.relnamespace
    where
      n.nspname not in ('pg_catalog', 'information_schema') and
      (c.contype = 'u' or c.contype = 'p');
  `).then(_ref13 => {
  let rows = _ref13.rows;
  return rows;
}).each(_ref14 => {
  let schemaName = _ref14.schemaName;
  let tableName = _ref14.tableName;
  let columnNums = _ref14.columnNums;

  const table = catalog.getTable(schemaName, tableName);
  const allColumns = table.getColumns();
  const columns = columnNums.map(colNum => allColumns.find(_ref15 => {
    let num = _ref15.num;
    return num === colNum;
  }));
  table._uniqueConstraints.push(columns);
});

const addProcedures = (client, catalog) => client.queryAsync(`
    select
      n.nspname as "schemaName",
      p.proname as "name",
      d.description as "description",
      case
        when p.provolatile = 'i' then false
        when p.provolatile = 's' then false
        else true
      end as "isMutation",
      p.proisstrict as "isStrict",
      p.proretset as "returnsSet",
      p.proargtypes as "argTypes",
      p.proargnames as "argNames",
      p.prorettype as "returnType"
    from
      pg_catalog.pg_proc as p
      left join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
      left join pg_catalog.pg_description as d on d.objoid = p.oid and d.objsubid = 0
    where
      n.nspname not in ('pg_catalog', 'information_schema');
  `).then(_ref16 => {
  let rows = _ref16.rows;
  return rows;
}).map(row => {
  // `argTypes` is an `oidvector` type? Which is wierd. So we need to hand
  // parse it.
  //
  // Also maps maintain order so we can use argument order to call functions,
  // yay!
  const argTypes = (0, _lodash.compact)(row.argTypes.split(' ').map((0, _lodash.ary)(parseInt, 1)));
  const argNames = row.argNames || [];
  const args = new Map();

  for (const i in argTypes) {
    const name = argNames[i];
    const type = argTypes[i];
    args.set(name || `arg_${ parseInt(i, 10) + 1 }`, catalog.getType(type));
  }

  return new _catalog.Procedure(_extends({
    schema: catalog.getSchema(row.schemaName)
  }, row, {
    args,
    returnType: catalog.getType(row.returnType)
  }));
}).filter(procedure => procedure).each(procedure => catalog.addProcedure(procedure));