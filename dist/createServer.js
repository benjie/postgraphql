'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _onFinished = require('on-finished');

var _onFinished2 = _interopRequireDefault(_onFinished);

var _httpErrors = require('http-errors');

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _finalhandler = require('finalhandler');

var _finalhandler2 = _interopRequireDefault(_finalhandler);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _graphql = require('graphql');

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/**
 * Creates an HTTP server with the provided configuration.
 *
 * @param {Object} options
 * @param {GraphQLSchema} options.graphqlSchema
 * @param {Object} options.pgConfig
 * @param {string} options.route
 * @param {boolean} options.development
 * @returns {Server}
 */
const createServer = _ref => {
  let graphqlSchema = _ref.graphqlSchema;
  let pgConfig = _ref.pgConfig;
  let anonymousRole = _ref.anonymousRole;
  var _ref$route = _ref.route;
  let route = _ref$route === undefined ? '/' : _ref$route;
  let secret = _ref.secret;
  var _ref$development = _ref.development;
  let development = _ref$development === undefined ? true : _ref$development;
  var _ref$log = _ref.log;
  let log = _ref$log === undefined ? true : _ref$log;

  const server = new _express2['default']();

  server.disable('x-powered-by');

  if (log) server.use((0, _morgan2['default'])(development ? 'dev' : 'common'));
  server.use((0, _serveFavicon2['default'])(_path2['default'].join(__dirname, '../assets/favicon.ico')));

  // Enabels CORS. See [this][1] flowchart for an explanation of how CORS
  // works. Note that these headers are set for all requests, CORS algorithms
  // normally run a preflight request using the `OPTIONS` method to get these
  // headers.
  //
  // [1]: http://www.html5rocks.com/static/images/cors_server_flowchart.png
  server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Request-Method', 'GET, POST');
    res.header('Access-Control-Allow-Headers', ['Origin', 'X-Requested-With',
    // Used by `express-graphql` to determine whether to expose the GraphiQL
    // interface (`text/html`) or not.
    'Accept',
    // Used by PostGraphQL for auth purposes.
    'Authorization',
    // The `Content-*` headers are used when making requests with a body,
    // like in a POST request.
    'Content-Type', 'Content-Length'].join(', '));
    next();
  });

  // Don’t execute our GraphQL stuffs for options requests.
  server.options('/*', (req, res) => {
    res.sendStatus(200);
  });

  server.all(route, (0, _expressGraphql2['default'])((() => {
    var _ref2 = _asyncToGenerator(function* (req) {
      // Acquire a new client for every request.
      const client = yield _pg2['default'].connectAsync(pgConfig);

      // Start a transaction for our client and set it up.
      yield client.queryAsync('begin');

      // If we have a secret, let’s setup the request transaction.
      yield setupRequestTransaction(req, client, secret, anonymousRole);

      // Make sure we release our client back to the pool once the response has
      // finished.
      (0, _onFinished2['default'])(req.res, function () {
        // Try to end our session with a commit. If it succeeds, release the
        // client back into the pool. If it fails, release the client back into
        // the pool, but also report that it failed. We cannot report an error in
        // the request at this point because it has finished.
        client.queryAsync('commit').then(function () {
          return client.end();
        })['catch'](function (error) {
          console.error(error.stack); // eslint-disable-line no-console
          client.end();
        });
      });

      return {
        // Await the `graphqlSchema` because it may be a promise.
        schema: yield graphqlSchema,
        context: { client },
        pretty: development,
        graphiql: development,
        formatError: development ? developmentFormatError : _graphql.formatError
      };
    });

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  })()));

  // If next is not defined, use the `finalHandler`.
  return (req, res, next) => server(req, res, next || (0, _finalhandler2['default'])(req, res));
};

exports['default'] = createServer;


const setupRequestTransaction = (() => {
  var _ref3 = _asyncToGenerator(function* (req, client, secret, anonymousRole) {
    // First, get the possible `Bearer` token from the request. If it does not
    // exist, exit.
    const token = getToken(req);

    // If there is no secret or there is no token, set the `anonymousRole` if it
    // exists, but always return.
    if (!secret || !token) {
      // Set the anonymous role if it exists.
      if (anonymousRole) {
        yield client.queryAsync('select set_config(\'role\', $1, true)', [anonymousRole]);
      }

      return;
    }

    let decoded;

    // If `jwt.verifyAsync` throws an error, catch it and re-throw it as a 403 error.
    try {
      decoded = yield _jsonwebtoken2['default'].verifyAsync(token, secret, { audience: 'postgraphql' });
    } catch (error) {
      throw new _httpErrors.Forbidden(error.message);
    }

    const role = decoded.role || anonymousRole;
    const values = [];
    const querySelection = [];

    // Make sure to set the local role if it exists.
    if (role) {
      values.push(role);
      querySelection.push('set_config(\'role\', $1, true)');
    }

    // Iterate through all of the JWT decoded values and set a local parameter
    // with that key and value.
    (0, _lodash.forEach)(decoded, function (value, key) {
      values.push(key);
      values.push(value);
      querySelection.push(`set_config('jwt.claims.' || $${ values.length - 1 }, $${ values.length }, true)`);
    });

    yield client.queryAsync(`select ${ querySelection.join(', ') }`, values);
  });

  return function setupRequestTransaction(_x2, _x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
})();

/**
 * Parses the `Bearer` auth scheme token out of the `Authorization` header as
 * defined by [RFC7235][1].
 *
 * ```
 * Authorization = credentials
 * credentials   = auth-scheme [ 1*SP ( token68 / #auth-param ) ]
 * token68       = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" )*"="
 * ```
 *
 * [1]: https://tools.ietf.org/html/rfc7235
 *
 * @private
 */
const bearerRex = /^\s*bearer\s+([a-z0-9\-._~+/]+=*)\s*$/i;

const getToken = req => {
  const authorization = req.headers.authorization;

  if (authorization == null) return null;
  const match = bearerRex.exec(authorization);
  if (!match) throw new _httpErrors.BadRequest('Authorization header is not in the correct bearer token format.');
  return match[1];
};

const developmentFormatError = error => {
  console.error(error.stack); // eslint-disable-line no-console
  return {
    message: error.message,
    locations: error.locations,
    stack: error.stack
  };
};