'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// Side effect…
_bluebird2['default'].promisifyAll(_pg2['default']);
_bluebird2['default'].promisifyAll(_pg.Client);
_bluebird2['default'].promisifyAll(_jsonwebtoken2['default']);