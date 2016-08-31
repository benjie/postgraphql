#!/usr/bin/env node
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* eslint-disable no-console */

require('./promisify');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _commander = require('commander');

var _pgConnectionString = require('pg-connection-string');

var _postgraphql = require('./postgraphql.js');

var _postgraphql2 = _interopRequireDefault(_postgraphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

const manifest = JSON.parse((0, _fs.readFileSync)(_path2['default'].resolve(__dirname, '../package.json')));

const main = () => {
  const program = new _commander.Command('postgraphql');

  /* eslint-disable max-len */
  program.version(manifest.version).usage('[options] <url>').option('-s, --schema <identifier>', 'the PostgreSQL schema to serve a GraphQL server of. defaults to public').option('-a, --anonymous-role <name>', 'the PostgreSQL role to use for requests that are non-authenticated. no role is set by default').option('-n, --hostname <name>', 'a URL hostname the server will listen to. defaults to localhost').option('-p, --port <integer>', 'a URL port the server will listen to. defaults to 3000', parseInt).option('-d, --development', 'enables a development mode which enables GraphiQL, nicer errors, and JSON pretty printing').option('-r, --route <path>', 'the route to mount the GraphQL server on. defaults to /').option('-e, --secret <string>', 'the secret to be used to encrypt tokens. token authentication disabled if this is not set').option('-m, --max-pool-size <integer>', 'the maximum number of connections to keep in the connection pool. defaults to 10').parse(process.argv);
  /* eslint-enable max-len */

  var _program$args = _slicedToArray(program.args, 1);

  const connection = _program$args[0];
  const schemaName = program.schema;
  const anonymousRole = program.anonymousRole;
  var _program$hostname = program.hostname;
  const hostname = _program$hostname === undefined ? 'localhost' : _program$hostname;
  var _program$port = program.port;
  const port = _program$port === undefined ? 3000 : _program$port;
  var _program$development = program.development;
  const development = _program$development === undefined ? false : _program$development;
  var _program$route = program.route;
  const route = _program$route === undefined ? '/' : _program$route;
  const secret = program.secret;
  var _program$maxPoolSize = program.maxPoolSize;
  const maxPoolSize = _program$maxPoolSize === undefined ? 10 : _program$maxPoolSize;


  if (!connection) throw new Error('Must define a PostgreSQL connection string to connect to.');

  // Parse out the connection string into an object and attach a
  // `poolSize` option.
  const pgConfig = _extends({}, (0, _pgConnectionString.parse)(connection), {
    poolSize: maxPoolSize
  });

  // Create the GraphQL HTTP server.
  const handler = (0, _postgraphql2['default'])(pgConfig, schemaName, {
    anonymousRole,
    route,
    secret,
    development
  });

  _http2['default'].createServer(handler).listen(port, hostname, () => {
    console.log(`GraphQL server listening at http://${ hostname }:${ port }${ route } 🚀`);
  });
};

try {
  main();
} catch (error) {
  console.error(error.stack);
}