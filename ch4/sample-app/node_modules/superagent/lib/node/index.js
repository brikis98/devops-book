"use strict";

/**
 * Module dependencies.
 */

const {
  format
} = require('url');
const Stream = require('stream');
const https = require('https');
const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const util = require('util');
const qs = require('qs');
const mime = require('mime');
let methods = require('methods');
const FormData = require('form-data');
const formidable = require('formidable');
const debug = require('debug')('superagent');
const CookieJar = require('cookiejar');
const safeStringify = require('fast-safe-stringify');
const utils = require('../utils');
const RequestBase = require('../request-base');
const http2 = require('./http2wrapper');
const {
  unzip
} = require('./unzip');
const Response = require('./response');
const {
  mixin,
  hasOwn
} = utils;
function request(method, url) {
  // callback
  if (typeof url === 'function') {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (arguments.length === 1) {
    return new exports.Request('GET', method);
  }
  return new exports.Request(method, url);
}
module.exports = request;
exports = module.exports;

/**
 * Expose `Request`.
 */

exports.Request = Request;

/**
 * Expose the agent function
 */

exports.agent = require('./agent');

/**
 * Noop.
 */

function noop() {}

/**
 * Expose `Response`.
 */

exports.Response = Response;

/**
 * Define "form" mime type.
 */

mime.define({
  'application/x-www-form-urlencoded': ['form', 'urlencoded', 'form-data']
}, true);

/**
 * Protocol map.
 */

exports.protocols = {
  'http:': http,
  'https:': https,
  'http2:': http2
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

exports.serialize = {
  'application/x-www-form-urlencoded': qs.stringify,
  'application/json': safeStringify
};

/**
 * Default parsers.
 *
 *     superagent.parse['application/xml'] = function(res, fn){
 *       fn(null, res);
 *     };
 *
 */

exports.parse = require('./parsers');

/**
 * Default buffering map. Can be used to set certain
 * response types to buffer/not buffer.
 *
 *     superagent.buffer['application/xml'] = true;
 */
exports.buffer = {};

/**
 * Initialize internal header tracking properties on a request instance.
 *
 * @param {Object} req the instance
 * @api private
 */
function _initHeaders(request_) {
  request_._header = {
    // coerces header names to lowercase
  };
  request_.header = {
    // preserves header name case
  };
}

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String|Object} url
 * @api public
 */

function Request(method, url) {
  Stream.call(this);
  if (typeof url !== 'string') url = format(url);
  this._enableHttp2 = Boolean(process.env.HTTP2_TEST); // internal only
  this._agent = false;
  this._formData = null;
  this.method = method;
  this.url = url;
  _initHeaders(this);
  this.writable = true;
  this._redirects = 0;
  this.redirects(method === 'HEAD' ? 0 : 5);
  this.cookies = '';
  this.qs = {};
  this._query = [];
  this.qsRaw = this._query; // Unused, for backwards compatibility only
  this._redirectList = [];
  this._streamRequest = false;
  this._lookup = undefined;
  this.once('end', this.clearTimeout.bind(this));
}

/**
 * Inherit from `Stream` (which inherits from `EventEmitter`).
 * Mixin `RequestBase`.
 */
util.inherits(Request, Stream);
mixin(Request.prototype, RequestBase.prototype);

/**
 * Enable or Disable http2.
 *
 * Enable http2.
 *
 * ``` js
 * request.get('http://localhost/')
 *   .http2()
 *   .end(callback);
 *
 * request.get('http://localhost/')
 *   .http2(true)
 *   .end(callback);
 * ```
 *
 * Disable http2.
 *
 * ``` js
 * request = request.http2();
 * request.get('http://localhost/')
 *   .http2(false)
 *   .end(callback);
 * ```
 *
 * @param {Boolean} enable
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.http2 = function (bool) {
  if (exports.protocols['http2:'] === undefined) {
    throw new Error('superagent: this version of Node.js does not support http2');
  }
  this._enableHttp2 = bool === undefined ? true : bool;
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('http://localhost/upload')
 *   .attach('field', Buffer.from('<b>Hello world</b>'), 'hello.html')
 *   .end(callback);
 * ```
 *
 * A filename may also be used:
 *
 * ``` js
 * request.post('http://localhost/upload')
 *   .attach('files', 'image.jpg')
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {String|fs.ReadStream|Buffer} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function (field, file, options) {
  if (file) {
    if (this._data) {
      throw new Error("superagent can't mix .send() and .attach()");
    }
    let o = options || {};
    if (typeof options === 'string') {
      o = {
        filename: options
      };
    }
    if (typeof file === 'string') {
      if (!o.filename) o.filename = file;
      debug('creating `fs.ReadStream` instance for file: %s', file);
      file = fs.createReadStream(file);
      file.on('error', error => {
        const formData = this._getFormData();
        formData.emit('error', error);
      });
    } else if (!o.filename && file.path) {
      o.filename = file.path;
    }
    this._getFormData().append(field, file, o);
  }
  return this;
};
Request.prototype._getFormData = function () {
  if (!this._formData) {
    this._formData = new FormData();
    this._formData.on('error', error => {
      debug('FormData error', error);
      if (this.called) {
        // The request has already finished and the callback was called.
        // Silently ignore the error.
        return;
      }
      this.callback(error);
      this.abort();
    });
  }
  return this._formData;
};

/**
 * Gets/sets the `Agent` to use for this HTTP request. The default (if this
 * function is not called) is to opt out of connection pooling (`agent: false`).
 *
 * @param {http.Agent} agent
 * @return {http.Agent}
 * @api public
 */

Request.prototype.agent = function (agent) {
  if (arguments.length === 0) return this._agent;
  this._agent = agent;
  return this;
};

/**
 * Gets/sets the `lookup` function to use custom DNS resolver.
 *
 * @param {Function} lookup
 * @return {Function}
 * @api public
 */

Request.prototype.lookup = function (lookup) {
  if (arguments.length === 0) return this._lookup;
  this._lookup = lookup;
  return this;
};

/**
 * Set _Content-Type_ response header passed through `mime.getType()`.
 *
 * Examples:
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/json')
 *        .send(jsonstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function (type) {
  return this.set('Content-Type', type.includes('/') ? type : mime.getType(type));
};

/**
 * Set _Accept_ response header passed through `mime.getType()`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function (type) {
  return this.set('Accept', type.includes('/') ? type : mime.getType(type));
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function (value) {
  if (typeof value === 'string') {
    this._query.push(value);
  } else {
    Object.assign(this.qs, value);
  }
  return this;
};

/**
 * Write raw `data` / `encoding` to the socket.
 *
 * @param {Buffer|String} data
 * @param {String} encoding
 * @return {Boolean}
 * @api public
 */

Request.prototype.write = function (data, encoding) {
  const request_ = this.request();
  if (!this._streamRequest) {
    this._streamRequest = true;
  }
  return request_.write(data, encoding);
};

/**
 * Pipe the request body to `stream`.
 *
 * @param {Stream} stream
 * @param {Object} options
 * @return {Stream}
 * @api public
 */

Request.prototype.pipe = function (stream, options) {
  this.piped = true; // HACK...
  this.buffer(false);
  this.end();
  return this._pipeContinue(stream, options);
};
Request.prototype._pipeContinue = function (stream, options) {
  this.req.once('response', res => {
    // redirect
    if (isRedirect(res.statusCode) && this._redirects++ !== this._maxRedirects) {
      return this._redirect(res) === this ? this._pipeContinue(stream, options) : undefined;
    }
    this.res = res;
    this._emitResponse();
    if (this._aborted) return;
    if (this._shouldUnzip(res)) {
      const unzipObject = zlib.createUnzip();
      unzipObject.on('error', error => {
        if (error && error.code === 'Z_BUF_ERROR') {
          // unexpected end of file is ignored by browsers and curl
          stream.emit('end');
          return;
        }
        stream.emit('error', error);
      });
      res.pipe(unzipObject).pipe(stream, options);
      // don't emit 'end' until unzipObject has completed writing all its data.
      unzipObject.once('end', () => this.emit('end'));
    } else {
      res.pipe(stream, options);
      res.once('end', () => this.emit('end'));
    }
  });
  return stream;
};

/**
 * Enable / disable buffering.
 *
 * @return {Boolean} [val]
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.buffer = function (value) {
  this._buffer = value !== false;
  return this;
};

/**
 * Redirect to `url
 *
 * @param {IncomingMessage} res
 * @return {Request} for chaining
 * @api private
 */

Request.prototype._redirect = function (res) {
  let url = res.headers.location;
  if (!url) {
    return this.callback(new Error('No location header for redirect'), res);
  }
  debug('redirect %s -> %s', this.url, url);

  // location
  url = new URL(url, this.url).href;

  // ensure the response is being consumed
  // this is required for Node v0.10+
  res.resume();
  let headers = this.req.getHeaders ? this.req.getHeaders() : this.req._headers;
  const changesOrigin = new URL(url).host !== new URL(this.url).host;

  // implementation of 302 following defacto standard
  if (res.statusCode === 301 || res.statusCode === 302) {
    // strip Content-* related fields
    // in case of POST etc
    headers = utils.cleanHeader(headers, changesOrigin);

    // force GET
    this.method = this.method === 'HEAD' ? 'HEAD' : 'GET';

    // clear data
    this._data = null;
  }

  // 303 is always GET
  if (res.statusCode === 303) {
    // strip Content-* related fields
    // in case of POST etc
    headers = utils.cleanHeader(headers, changesOrigin);

    // force method
    this.method = 'GET';

    // clear data
    this._data = null;
  }

  // 307 preserves method
  // 308 preserves method
  delete headers.host;
  delete this.req;
  delete this._formData;

  // remove all add header except User-Agent
  _initHeaders(this);

  // redirect
  this.res = res;
  this._endCalled = false;
  this.url = url;
  this.qs = {};
  this._query.length = 0;
  this.set(headers);
  this._emitRedirect();
  this._redirectList.push(this.url);
  this.end(this._callback);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * Examples:
 *
 *   .auth('tobi', 'learnboost')
 *   .auth('tobi:learnboost')
 *   .auth('tobi')
 *   .auth(accessToken, { type: 'bearer' })
 *
 * @param {String} user
 * @param {String} [pass]
 * @param {Object} [options] options with authorization type 'basic' or 'bearer' ('basic' is default)
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function (user, pass, options) {
  if (arguments.length === 1) pass = '';
  if (typeof pass === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }
  if (!options) {
    options = {
      type: 'basic'
    };
  }
  const encoder = string => Buffer.from(string).toString('base64');
  return this._auth(user, pass, options, encoder);
};

/**
 * Set the certificate authority option for https request.
 *
 * @param {Buffer | Array} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.ca = function (cert) {
  this._ca = cert;
  return this;
};

/**
 * Set the client certificate key option for https request.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.key = function (cert) {
  this._key = cert;
  return this;
};

/**
 * Set the key, certificate, and CA certs of the client in PFX or PKCS12 format.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.pfx = function (cert) {
  if (typeof cert === 'object' && !Buffer.isBuffer(cert)) {
    this._pfx = cert.pfx;
    this._passphrase = cert.passphrase;
  } else {
    this._pfx = cert;
  }
  return this;
};

/**
 * Set the client certificate option for https request.
 *
 * @param {Buffer | String} cert
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.cert = function (cert) {
  this._cert = cert;
  return this;
};

/**
 * Do not reject expired or invalid TLS certs.
 * sets `rejectUnauthorized=true`. Be warned that this allows MITM attacks.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.disableTLSCerts = function () {
  this._disableTLSCerts = true;
  return this;
};

/**
 * Return an http[s] request.
 *
 * @return {OutgoingMessage}
 * @api private
 */

// eslint-disable-next-line complexity
Request.prototype.request = function () {
  if (this.req) return this.req;
  const options = {};
  try {
    const query = qs.stringify(this.qs, {
      indices: false,
      strictNullHandling: true
    });
    if (query) {
      this.qs = {};
      this._query.push(query);
    }
    this._finalizeQueryString();
  } catch (err) {
    return this.emit('error', err);
  }
  let {
    url: urlString
  } = this;
  const retries = this._retries;

  // default to http://
  if (urlString.indexOf('http') !== 0) urlString = `http://${urlString}`;
  const url = new URL(urlString);
  let {
    protocol
  } = url;
  let path = `${url.pathname}${url.search}`;

  // support unix sockets
  if (/^https?\+unix:/.test(protocol) === true) {
    // get the protocol
    protocol = `${protocol.split('+')[0]}:`;

    // get the socket path
    options.socketPath = url.hostname.replace(/%2F/g, '/');
    url.host = '';
    url.hostname = '';
  }

  // Override IP address of a hostname
  if (this._connectOverride) {
    const {
      hostname
    } = url;
    const match = hostname in this._connectOverride ? this._connectOverride[hostname] : this._connectOverride['*'];
    if (match) {
      // backup the real host
      if (!this._header.host) {
        this.set('host', url.host);
      }
      let newHost;
      let newPort;
      if (typeof match === 'object') {
        newHost = match.host;
        newPort = match.port;
      } else {
        newHost = match;
        newPort = url.port;
      }

      // wrap [ipv6]
      url.host = /:/.test(newHost) ? `[${newHost}]` : newHost;
      if (newPort) {
        url.host += `:${newPort}`;
        url.port = newPort;
      }
      url.hostname = newHost;
    }
  }

  // options
  options.method = this.method;
  options.port = url.port;
  options.path = path;
  options.host = url.hostname;
  options.ca = this._ca;
  options.key = this._key;
  options.pfx = this._pfx;
  options.cert = this._cert;
  options.passphrase = this._passphrase;
  options.agent = this._agent;
  options.lookup = this._lookup;
  options.rejectUnauthorized = typeof this._disableTLSCerts === 'boolean' ? !this._disableTLSCerts : process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';

  // Allows request.get('https://1.2.3.4/').set('Host', 'example.com')
  if (this._header.host) {
    options.servername = this._header.host.replace(/:\d+$/, '');
  }
  if (this._trustLocalhost && /^(?:localhost|127\.0\.0\.\d+|(0*:)+:0*1)$/.test(url.hostname)) {
    options.rejectUnauthorized = false;
  }

  // initiate request
  const module_ = this._enableHttp2 ? exports.protocols['http2:'].setProtocol(protocol) : exports.protocols[protocol];

  // request
  this.req = module_.request(options);
  const {
    req
  } = this;

  // set tcp no delay
  req.setNoDelay(true);
  if (options.method !== 'HEAD') {
    req.setHeader('Accept-Encoding', 'gzip, deflate');
  }
  this.protocol = protocol;
  this.host = url.host;

  // expose events
  req.once('drain', () => {
    this.emit('drain');
  });
  req.on('error', error => {
    // flag abortion here for out timeouts
    // because node will emit a faux-error "socket hang up"
    // when request is aborted before a connection is made
    if (this._aborted) return;
    // if not the same, we are in the **old** (cancelled) request,
    // so need to continue (same as for above)
    if (this._retries !== retries) return;
    // if we've received a response then we don't want to let
    // an error in the request blow up the response
    if (this.response) return;
    this.callback(error);
  });

  // auth
  if (url.username || url.password) {
    this.auth(url.username, url.password);
  }
  if (this.username && this.password) {
    this.auth(this.username, this.password);
  }
  for (const key in this.header) {
    if (hasOwn(this.header, key)) req.setHeader(key, this.header[key]);
  }

  // add cookies
  if (this.cookies) {
    if (hasOwn(this._header, 'cookie')) {
      // merge
      const temporaryJar = new CookieJar.CookieJar();
      temporaryJar.setCookies(this._header.cookie.split('; '));
      temporaryJar.setCookies(this.cookies.split('; '));
      req.setHeader('Cookie', temporaryJar.getCookies(CookieJar.CookieAccessInfo.All).toValueString());
    } else {
      req.setHeader('Cookie', this.cookies);
    }
  }
  return req;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function (error, res) {
  if (this._shouldRetry(error, res)) {
    return this._retry();
  }

  // Avoid the error which is emitted from 'socket hang up' to cause the fn undefined error on JS runtime.
  const fn = this._callback || noop;
  this.clearTimeout();
  if (this.called) return console.warn('superagent: double callback bug');
  this.called = true;
  if (!error) {
    try {
      if (!this._isResponseOK(res)) {
        let message = 'Unsuccessful HTTP response';
        if (res) {
          message = http.STATUS_CODES[res.status] || message;
        }
        error = new Error(message);
        error.status = res ? res.status : undefined;
      }
    } catch (err) {
      error = err;
      error.status = error.status || (res ? res.status : undefined);
    }
  }

  // It's important that the callback is called outside try/catch
  // to avoid double callback
  if (!error) {
    return fn(null, res);
  }
  error.response = res;
  if (this._maxRetries) error.retries = this._retries - 1;

  // only emit error event if there is a listener
  // otherwise we assume the callback to `.end()` will get the error
  if (error && this.listeners('error').length > 0) {
    this.emit('error', error);
  }
  fn(error, res);
};

/**
 * Check if `obj` is a host object,
 *
 * @param {Object} obj host object
 * @return {Boolean} is a host object
 * @api private
 */
Request.prototype._isHost = function (object) {
  return Buffer.isBuffer(object) || object instanceof Stream || object instanceof FormData;
};

/**
 * Initiate request, invoking callback `fn(err, res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype._emitResponse = function (body, files) {
  const response = new Response(this);
  this.response = response;
  response.redirects = this._redirectList;
  if (undefined !== body) {
    response.body = body;
  }
  response.files = files;
  if (this._endCalled) {
    response.pipe = function () {
      throw new Error("end() has already been called, so it's too late to start piping");
    };
  }
  this.emit('response', response);
  return response;
};

/**
 * Emit `redirect` event, passing an instanceof `Response`.
 *
 * @api private
 */

Request.prototype._emitRedirect = function () {
  const response = new Response(this);
  response.redirects = this._redirectList;
  this.emit('redirect', response);
};
Request.prototype.end = function (fn) {
  this.request();
  debug('%s %s', this.method, this.url);
  if (this._endCalled) {
    throw new Error('.end() was called twice. This is not supported in superagent');
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;
  this._end();
};
Request.prototype._end = function () {
  if (this._aborted) return this.callback(new Error('The request has been aborted even before .end() was called'));
  let data = this._data;
  const {
    req
  } = this;
  const {
    method
  } = this;
  this._setTimeouts();

  // body
  if (method !== 'HEAD' && !req._headerSent) {
    // serialize stuff
    if (typeof data !== 'string') {
      let contentType = req.getHeader('Content-Type');
      // Parse out just the content type from the header (ignore the charset)
      if (contentType) contentType = contentType.split(';')[0];
      let serialize = this._serializer || exports.serialize[contentType];
      if (!serialize && isJSON(contentType)) {
        serialize = exports.serialize['application/json'];
      }
      if (serialize) data = serialize(data);
    }

    // content-length
    if (data && !req.getHeader('Content-Length')) {
      req.setHeader('Content-Length', Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data));
    }
  }

  // response
  // eslint-disable-next-line complexity
  req.once('response', res => {
    debug('%s %s -> %s', this.method, this.url, res.statusCode);
    if (this._responseTimeoutTimer) {
      clearTimeout(this._responseTimeoutTimer);
    }
    if (this.piped) {
      return;
    }
    const max = this._maxRedirects;
    const mime = utils.type(res.headers['content-type'] || '') || 'text/plain';
    let type = mime.split('/')[0];
    if (type) type = type.toLowerCase().trim();
    const multipart = type === 'multipart';
    const redirect = isRedirect(res.statusCode);
    const responseType = this._responseType;
    this.res = res;

    // redirect
    if (redirect && this._redirects++ !== max) {
      return this._redirect(res);
    }
    if (this.method === 'HEAD') {
      this.emit('end');
      this.callback(null, this._emitResponse());
      return;
    }

    // zlib support
    if (this._shouldUnzip(res)) {
      unzip(req, res);
    }
    let buffer = this._buffer;
    if (buffer === undefined && mime in exports.buffer) {
      buffer = Boolean(exports.buffer[mime]);
    }
    let parser = this._parser;
    if (undefined === buffer && parser) {
      console.warn("A custom superagent parser has been set, but buffering strategy for the parser hasn't been configured. Call `req.buffer(true or false)` or set `superagent.buffer[mime] = true or false`");
      buffer = true;
    }
    if (!parser) {
      if (responseType) {
        parser = exports.parse.image; // It's actually a generic Buffer
        buffer = true;
      } else if (multipart) {
        const form = formidable.formidable();
        parser = form.parse.bind(form);
        buffer = true;
      } else if (isBinary(mime)) {
        parser = exports.parse.image;
        buffer = true; // For backwards-compatibility buffering default is ad-hoc MIME-dependent
      } else if (exports.parse[mime]) {
        parser = exports.parse[mime];
      } else if (type === 'text') {
        parser = exports.parse.text;
        buffer = buffer !== false;
        // everyone wants their own white-labeled json
      } else if (isJSON(mime)) {
        parser = exports.parse['application/json'];
        buffer = buffer !== false;
      } else if (buffer) {
        parser = exports.parse.text;
      } else if (undefined === buffer) {
        parser = exports.parse.image; // It's actually a generic Buffer
        buffer = true;
      }
    }

    // by default only buffer text/*, json and messed up thing from hell
    if (undefined === buffer && isText(mime) || isJSON(mime)) {
      buffer = true;
    }
    this._resBuffered = buffer;
    let parserHandlesEnd = false;
    if (buffer) {
      // Protectiona against zip bombs and other nuisance
      let responseBytesLeft = this._maxResponseSize || 200000000;
      res.on('data', buf => {
        responseBytesLeft -= buf.byteLength || buf.length > 0 ? buf.length : 0;
        if (responseBytesLeft < 0) {
          // This will propagate through error event
          const error = new Error('Maximum response size reached');
          error.code = 'ETOOLARGE';
          // Parsers aren't required to observe error event,
          // so would incorrectly report success
          parserHandlesEnd = false;
          // Will not emit error event
          res.destroy(error);
          // so we do callback now
          this.callback(error, null);
        }
      });
    }
    if (parser) {
      try {
        // Unbuffered parsers are supposed to emit response early,
        // which is weird BTW, because response.body won't be there.
        parserHandlesEnd = buffer;
        parser(res, (error, object, files) => {
          if (this.timedout) {
            // Timeout has already handled all callbacks
            return;
          }

          // Intentional (non-timeout) abort is supposed to preserve partial response,
          // even if it doesn't parse.
          if (error && !this._aborted) {
            return this.callback(error);
          }
          if (parserHandlesEnd) {
            if (multipart) {
              // formidable v3 always returns an array with the value in it
              // so we need to flatten it
              if (object) {
                for (const key in object) {
                  const value = object[key];
                  if (Array.isArray(value) && value.length === 1) {
                    object[key] = value[0];
                  } else {
                    object[key] = value;
                  }
                }
              }
              if (files) {
                for (const key in files) {
                  const value = files[key];
                  if (Array.isArray(value) && value.length === 1) {
                    files[key] = value[0];
                  } else {
                    files[key] = value;
                  }
                }
              }
            }
            this.emit('end');
            this.callback(null, this._emitResponse(object, files));
          }
        });
      } catch (err) {
        this.callback(err);
        return;
      }
    }
    this.res = res;

    // unbuffered
    if (!buffer) {
      debug('unbuffered %s %s', this.method, this.url);
      this.callback(null, this._emitResponse());
      if (multipart) return; // allow multipart to handle end event
      res.once('end', () => {
        debug('end %s %s', this.method, this.url);
        this.emit('end');
      });
      return;
    }

    // terminating events
    res.once('error', error => {
      parserHandlesEnd = false;
      this.callback(error, null);
    });
    if (!parserHandlesEnd) res.once('end', () => {
      debug('end %s %s', this.method, this.url);
      // TODO: unless buffering emit earlier to stream
      this.emit('end');
      this.callback(null, this._emitResponse());
    });
  });
  this.emit('request', this);
  const getProgressMonitor = () => {
    const lengthComputable = true;
    const total = req.getHeader('Content-Length');
    let loaded = 0;
    const progress = new Stream.Transform();
    progress._transform = (chunk, encoding, callback) => {
      loaded += chunk.length;
      this.emit('progress', {
        direction: 'upload',
        lengthComputable,
        loaded,
        total
      });
      callback(null, chunk);
    };
    return progress;
  };
  const bufferToChunks = buffer => {
    const chunkSize = 16 * 1024; // default highWaterMark value
    const chunking = new Stream.Readable();
    const totalLength = buffer.length;
    const remainder = totalLength % chunkSize;
    const cutoff = totalLength - remainder;
    for (let i = 0; i < cutoff; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      chunking.push(chunk);
    }
    if (remainder > 0) {
      const remainderBuffer = buffer.slice(-remainder);
      chunking.push(remainderBuffer);
    }
    chunking.push(null); // no more data

    return chunking;
  };

  // if a FormData instance got created, then we send that as the request body
  const formData = this._formData;
  if (formData) {
    // set headers
    const headers = formData.getHeaders();
    for (const i in headers) {
      if (hasOwn(headers, i)) {
        debug('setting FormData header: "%s: %s"', i, headers[i]);
        req.setHeader(i, headers[i]);
      }
    }

    // attempt to get "Content-Length" header
    formData.getLength((error, length) => {
      // TODO: Add chunked encoding when no length (if err)
      if (error) debug('formData.getLength had error', error, length);
      debug('got FormData Content-Length: %s', length);
      if (typeof length === 'number') {
        req.setHeader('Content-Length', length);
      }
      formData.pipe(getProgressMonitor()).pipe(req);
    });
  } else if (Buffer.isBuffer(data)) {
    bufferToChunks(data).pipe(getProgressMonitor()).pipe(req);
  } else {
    req.end(data);
  }
};

// Check whether response has a non-0-sized gzip-encoded body
Request.prototype._shouldUnzip = res => {
  if (res.statusCode === 204 || res.statusCode === 304) {
    // These aren't supposed to have any body
    return false;
  }

  // header content is a string, and distinction between 0 and no information is crucial
  if (res.headers['content-length'] === '0') {
    // We know that the body is empty (unfortunately, this check does not cover chunked encoding)
    return false;
  }

  // console.log(res);
  return /^\s*(?:deflate|gzip)\s*$/.test(res.headers['content-encoding']);
};

/**
 * Overrides DNS for selected hostnames. Takes object mapping hostnames to IP addresses.
 *
 * When making a request to a URL with a hostname exactly matching a key in the object,
 * use the given IP address to connect, instead of using DNS to resolve the hostname.
 *
 * A special host `*` matches every hostname (keep redirects in mind!)
 *
 *      request.connect({
 *        'test.example.com': '127.0.0.1',
 *        'ipv6.example.com': '::1',
 *      })
 */
Request.prototype.connect = function (connectOverride) {
  if (typeof connectOverride === 'string') {
    this._connectOverride = {
      '*': connectOverride
    };
  } else if (typeof connectOverride === 'object') {
    this._connectOverride = connectOverride;
  } else {
    this._connectOverride = undefined;
  }
  return this;
};
Request.prototype.trustLocalhost = function (toggle) {
  this._trustLocalhost = toggle === undefined ? true : toggle;
  return this;
};

// generate HTTP verb methods
if (!methods.includes('del')) {
  // create a copy so we don't cause conflicts with
  // other packages using the methods package and
  // npm 3.x
  methods = [...methods];
  methods.push('del');
}
for (let method of methods) {
  const name = method;
  method = method === 'del' ? 'delete' : method;
  method = method.toUpperCase();
  request[name] = (url, data, fn) => {
    const request_ = request(method, url);
    if (typeof data === 'function') {
      fn = data;
      data = null;
    }
    if (data) {
      if (method === 'GET' || method === 'HEAD') {
        request_.query(data);
      } else {
        request_.send(data);
      }
    }
    if (fn) request_.end(fn);
    return request_;
  };
}

/**
 * Check if `mime` is text and should be buffered.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api public
 */

function isText(mime) {
  const parts = mime.split('/');
  let type = parts[0];
  if (type) type = type.toLowerCase().trim();
  let subtype = parts[1];
  if (subtype) subtype = subtype.toLowerCase().trim();
  return type === 'text' || subtype === 'x-www-form-urlencoded';
}

// This is not a catchall, but a start. It might be useful
// in the long run to have file that includes all binary
// content types from https://www.iana.org/assignments/media-types/media-types.xhtml
function isBinary(mime) {
  let [registry, name] = mime.split('/');
  if (registry) registry = registry.toLowerCase().trim();
  if (name) name = name.toLowerCase().trim();
  return ['audio', 'font', 'image', 'video'].includes(registry) || ['gz', 'gzip'].includes(name);
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return /[/+]json($|[^-\w])/i.test(mime);
}

/**
 * Check if we should follow the redirect `code`.
 *
 * @param {Number} code
 * @return {Boolean}
 * @api private
 */

function isRedirect(code) {
  return [301, 302, 303, 305, 307, 308].includes(code);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmb3JtYXQiLCJyZXF1aXJlIiwiU3RyZWFtIiwiaHR0cHMiLCJodHRwIiwiZnMiLCJ6bGliIiwidXRpbCIsInFzIiwibWltZSIsIm1ldGhvZHMiLCJGb3JtRGF0YSIsImZvcm1pZGFibGUiLCJkZWJ1ZyIsIkNvb2tpZUphciIsInNhZmVTdHJpbmdpZnkiLCJ1dGlscyIsIlJlcXVlc3RCYXNlIiwiaHR0cDIiLCJ1bnppcCIsIlJlc3BvbnNlIiwibWl4aW4iLCJoYXNPd24iLCJyZXF1ZXN0IiwibWV0aG9kIiwidXJsIiwiZXhwb3J0cyIsIlJlcXVlc3QiLCJlbmQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJtb2R1bGUiLCJhZ2VudCIsIm5vb3AiLCJkZWZpbmUiLCJwcm90b2NvbHMiLCJzZXJpYWxpemUiLCJzdHJpbmdpZnkiLCJwYXJzZSIsImJ1ZmZlciIsIl9pbml0SGVhZGVycyIsInJlcXVlc3RfIiwiX2hlYWRlciIsImhlYWRlciIsImNhbGwiLCJfZW5hYmxlSHR0cDIiLCJCb29sZWFuIiwicHJvY2VzcyIsImVudiIsIkhUVFAyX1RFU1QiLCJfYWdlbnQiLCJfZm9ybURhdGEiLCJ3cml0YWJsZSIsIl9yZWRpcmVjdHMiLCJyZWRpcmVjdHMiLCJjb29raWVzIiwiX3F1ZXJ5IiwicXNSYXciLCJfcmVkaXJlY3RMaXN0IiwiX3N0cmVhbVJlcXVlc3QiLCJfbG9va3VwIiwidW5kZWZpbmVkIiwib25jZSIsImNsZWFyVGltZW91dCIsImJpbmQiLCJpbmhlcml0cyIsInByb3RvdHlwZSIsImJvb2wiLCJFcnJvciIsImF0dGFjaCIsImZpZWxkIiwiZmlsZSIsIm9wdGlvbnMiLCJfZGF0YSIsIm8iLCJmaWxlbmFtZSIsImNyZWF0ZVJlYWRTdHJlYW0iLCJvbiIsImVycm9yIiwiZm9ybURhdGEiLCJfZ2V0Rm9ybURhdGEiLCJlbWl0IiwicGF0aCIsImFwcGVuZCIsImNhbGxlZCIsImNhbGxiYWNrIiwiYWJvcnQiLCJsb29rdXAiLCJ0eXBlIiwic2V0IiwiaW5jbHVkZXMiLCJnZXRUeXBlIiwiYWNjZXB0IiwicXVlcnkiLCJ2YWx1ZSIsInB1c2giLCJPYmplY3QiLCJhc3NpZ24iLCJ3cml0ZSIsImRhdGEiLCJlbmNvZGluZyIsInBpcGUiLCJzdHJlYW0iLCJwaXBlZCIsIl9waXBlQ29udGludWUiLCJyZXEiLCJyZXMiLCJpc1JlZGlyZWN0Iiwic3RhdHVzQ29kZSIsIl9tYXhSZWRpcmVjdHMiLCJfcmVkaXJlY3QiLCJfZW1pdFJlc3BvbnNlIiwiX2Fib3J0ZWQiLCJfc2hvdWxkVW56aXAiLCJ1bnppcE9iamVjdCIsImNyZWF0ZVVuemlwIiwiY29kZSIsIl9idWZmZXIiLCJoZWFkZXJzIiwibG9jYXRpb24iLCJVUkwiLCJocmVmIiwicmVzdW1lIiwiZ2V0SGVhZGVycyIsIl9oZWFkZXJzIiwiY2hhbmdlc09yaWdpbiIsImhvc3QiLCJjbGVhbkhlYWRlciIsIl9lbmRDYWxsZWQiLCJfZW1pdFJlZGlyZWN0IiwiX2NhbGxiYWNrIiwiYXV0aCIsInVzZXIiLCJwYXNzIiwiZW5jb2RlciIsInN0cmluZyIsIkJ1ZmZlciIsImZyb20iLCJ0b1N0cmluZyIsIl9hdXRoIiwiY2EiLCJjZXJ0IiwiX2NhIiwia2V5IiwiX2tleSIsInBmeCIsImlzQnVmZmVyIiwiX3BmeCIsIl9wYXNzcGhyYXNlIiwicGFzc3BocmFzZSIsIl9jZXJ0IiwiZGlzYWJsZVRMU0NlcnRzIiwiX2Rpc2FibGVUTFNDZXJ0cyIsImluZGljZXMiLCJzdHJpY3ROdWxsSGFuZGxpbmciLCJfZmluYWxpemVRdWVyeVN0cmluZyIsImVyciIsInVybFN0cmluZyIsInJldHJpZXMiLCJfcmV0cmllcyIsImluZGV4T2YiLCJwcm90b2NvbCIsInBhdGhuYW1lIiwic2VhcmNoIiwidGVzdCIsInNwbGl0Iiwic29ja2V0UGF0aCIsImhvc3RuYW1lIiwicmVwbGFjZSIsIl9jb25uZWN0T3ZlcnJpZGUiLCJtYXRjaCIsIm5ld0hvc3QiLCJuZXdQb3J0IiwicG9ydCIsInJlamVjdFVuYXV0aG9yaXplZCIsIk5PREVfVExTX1JFSkVDVF9VTkFVVEhPUklaRUQiLCJzZXJ2ZXJuYW1lIiwiX3RydXN0TG9jYWxob3N0IiwibW9kdWxlXyIsInNldFByb3RvY29sIiwic2V0Tm9EZWxheSIsInNldEhlYWRlciIsInJlc3BvbnNlIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInRlbXBvcmFyeUphciIsInNldENvb2tpZXMiLCJjb29raWUiLCJnZXRDb29raWVzIiwiQ29va2llQWNjZXNzSW5mbyIsIkFsbCIsInRvVmFsdWVTdHJpbmciLCJfc2hvdWxkUmV0cnkiLCJfcmV0cnkiLCJmbiIsImNvbnNvbGUiLCJ3YXJuIiwiX2lzUmVzcG9uc2VPSyIsIm1lc3NhZ2UiLCJTVEFUVVNfQ09ERVMiLCJzdGF0dXMiLCJfbWF4UmV0cmllcyIsImxpc3RlbmVycyIsIl9pc0hvc3QiLCJvYmplY3QiLCJib2R5IiwiZmlsZXMiLCJfZW5kIiwiX3NldFRpbWVvdXRzIiwiX2hlYWRlclNlbnQiLCJjb250ZW50VHlwZSIsImdldEhlYWRlciIsIl9zZXJpYWxpemVyIiwiaXNKU09OIiwiYnl0ZUxlbmd0aCIsIl9yZXNwb25zZVRpbWVvdXRUaW1lciIsIm1heCIsInRvTG93ZXJDYXNlIiwidHJpbSIsIm11bHRpcGFydCIsInJlZGlyZWN0IiwicmVzcG9uc2VUeXBlIiwiX3Jlc3BvbnNlVHlwZSIsInBhcnNlciIsIl9wYXJzZXIiLCJpbWFnZSIsImZvcm0iLCJpc0JpbmFyeSIsInRleHQiLCJpc1RleHQiLCJfcmVzQnVmZmVyZWQiLCJwYXJzZXJIYW5kbGVzRW5kIiwicmVzcG9uc2VCeXRlc0xlZnQiLCJfbWF4UmVzcG9uc2VTaXplIiwiYnVmIiwiZGVzdHJveSIsInRpbWVkb3V0IiwiQXJyYXkiLCJpc0FycmF5IiwiZ2V0UHJvZ3Jlc3NNb25pdG9yIiwibGVuZ3RoQ29tcHV0YWJsZSIsInRvdGFsIiwibG9hZGVkIiwicHJvZ3Jlc3MiLCJUcmFuc2Zvcm0iLCJfdHJhbnNmb3JtIiwiY2h1bmsiLCJkaXJlY3Rpb24iLCJidWZmZXJUb0NodW5rcyIsImNodW5rU2l6ZSIsImNodW5raW5nIiwiUmVhZGFibGUiLCJ0b3RhbExlbmd0aCIsInJlbWFpbmRlciIsImN1dG9mZiIsImkiLCJzbGljZSIsInJlbWFpbmRlckJ1ZmZlciIsImdldExlbmd0aCIsImNvbm5lY3QiLCJjb25uZWN0T3ZlcnJpZGUiLCJ0cnVzdExvY2FsaG9zdCIsInRvZ2dsZSIsIm5hbWUiLCJ0b1VwcGVyQ2FzZSIsInNlbmQiLCJwYXJ0cyIsInN1YnR5cGUiLCJyZWdpc3RyeSJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ub2RlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG5jb25zdCB7IGZvcm1hdCB9ID0gcmVxdWlyZSgndXJsJyk7XG5jb25zdCBTdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbmNvbnN0IGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKTtcbmNvbnN0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCB6bGliID0gcmVxdWlyZSgnemxpYicpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbmNvbnN0IHFzID0gcmVxdWlyZSgncXMnKTtcbmNvbnN0IG1pbWUgPSByZXF1aXJlKCdtaW1lJyk7XG5sZXQgbWV0aG9kcyA9IHJlcXVpcmUoJ21ldGhvZHMnKTtcbmNvbnN0IEZvcm1EYXRhID0gcmVxdWlyZSgnZm9ybS1kYXRhJyk7XG5jb25zdCBmb3JtaWRhYmxlID0gcmVxdWlyZSgnZm9ybWlkYWJsZScpO1xuY29uc3QgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdzdXBlcmFnZW50Jyk7XG5jb25zdCBDb29raWVKYXIgPSByZXF1aXJlKCdjb29raWVqYXInKTtcbmNvbnN0IHNhZmVTdHJpbmdpZnkgPSByZXF1aXJlKCdmYXN0LXNhZmUtc3RyaW5naWZ5Jyk7XG5cbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbmNvbnN0IFJlcXVlc3RCYXNlID0gcmVxdWlyZSgnLi4vcmVxdWVzdC1iYXNlJyk7XG5jb25zdCBodHRwMiA9IHJlcXVpcmUoJy4vaHR0cDJ3cmFwcGVyJyk7XG5jb25zdCB7IHVuemlwIH0gPSByZXF1aXJlKCcuL3VuemlwJyk7XG5jb25zdCBSZXNwb25zZSA9IHJlcXVpcmUoJy4vcmVzcG9uc2UnKTtcblxuY29uc3QgeyBtaXhpbiwgaGFzT3duIH0gPSB1dGlscztcblxuZnVuY3Rpb24gcmVxdWVzdChtZXRob2QsIHVybCkge1xuICAvLyBjYWxsYmFja1xuICBpZiAodHlwZW9mIHVybCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBuZXcgZXhwb3J0cy5SZXF1ZXN0KCdHRVQnLCBtZXRob2QpLmVuZCh1cmwpO1xuICB9XG5cbiAgLy8gdXJsIGZpcnN0XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIG5ldyBleHBvcnRzLlJlcXVlc3QoJ0dFVCcsIG1ldGhvZCk7XG4gIH1cblxuICByZXR1cm4gbmV3IGV4cG9ydHMuUmVxdWVzdChtZXRob2QsIHVybCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWVzdDtcbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cztcblxuLyoqXG4gKiBFeHBvc2UgYFJlcXVlc3RgLlxuICovXG5cbmV4cG9ydHMuUmVxdWVzdCA9IFJlcXVlc3Q7XG5cbi8qKlxuICogRXhwb3NlIHRoZSBhZ2VudCBmdW5jdGlvblxuICovXG5cbmV4cG9ydHMuYWdlbnQgPSByZXF1aXJlKCcuL2FnZW50Jyk7XG5cbi8qKlxuICogTm9vcC5cbiAqL1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuLyoqXG4gKiBFeHBvc2UgYFJlc3BvbnNlYC5cbiAqL1xuXG5leHBvcnRzLlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbi8qKlxuICogRGVmaW5lIFwiZm9ybVwiIG1pbWUgdHlwZS5cbiAqL1xuXG5taW1lLmRlZmluZShcbiAge1xuICAgICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnOiBbJ2Zvcm0nLCAndXJsZW5jb2RlZCcsICdmb3JtLWRhdGEnXVxuICB9LFxuICB0cnVlXG4pO1xuXG4vKipcbiAqIFByb3RvY29sIG1hcC5cbiAqL1xuXG5leHBvcnRzLnByb3RvY29scyA9IHtcbiAgJ2h0dHA6JzogaHR0cCxcbiAgJ2h0dHBzOic6IGh0dHBzLFxuICAnaHR0cDI6JzogaHR0cDJcbn07XG5cbi8qKlxuICogRGVmYXVsdCBzZXJpYWxpemF0aW9uIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL3htbCddID0gZnVuY3Rpb24ob2JqKXtcbiAqICAgICAgIHJldHVybiAnZ2VuZXJhdGVkIHhtbCBoZXJlJztcbiAqICAgICB9O1xuICpcbiAqL1xuXG5leHBvcnRzLnNlcmlhbGl6ZSA9IHtcbiAgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc6IHFzLnN0cmluZ2lmeSxcbiAgJ2FwcGxpY2F0aW9uL2pzb24nOiBzYWZlU3RyaW5naWZ5XG59O1xuXG4vKipcbiAqIERlZmF1bHQgcGFyc2Vycy5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC5wYXJzZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihyZXMsIGZuKXtcbiAqICAgICAgIGZuKG51bGwsIHJlcyk7XG4gKiAgICAgfTtcbiAqXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2VycycpO1xuXG4vKipcbiAqIERlZmF1bHQgYnVmZmVyaW5nIG1hcC4gQ2FuIGJlIHVzZWQgdG8gc2V0IGNlcnRhaW5cbiAqIHJlc3BvbnNlIHR5cGVzIHRvIGJ1ZmZlci9ub3QgYnVmZmVyLlxuICpcbiAqICAgICBzdXBlcmFnZW50LmJ1ZmZlclsnYXBwbGljYXRpb24veG1sJ10gPSB0cnVlO1xuICovXG5leHBvcnRzLmJ1ZmZlciA9IHt9O1xuXG4vKipcbiAqIEluaXRpYWxpemUgaW50ZXJuYWwgaGVhZGVyIHRyYWNraW5nIHByb3BlcnRpZXMgb24gYSByZXF1ZXN0IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZXEgdGhlIGluc3RhbmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gX2luaXRIZWFkZXJzKHJlcXVlc3RfKSB7XG4gIHJlcXVlc3RfLl9oZWFkZXIgPSB7XG4gICAgLy8gY29lcmNlcyBoZWFkZXIgbmFtZXMgdG8gbG93ZXJjYXNlXG4gIH07XG4gIHJlcXVlc3RfLmhlYWRlciA9IHtcbiAgICAvLyBwcmVzZXJ2ZXMgaGVhZGVyIG5hbWUgY2FzZVxuICB9O1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlcXVlc3RgIHdpdGggdGhlIGdpdmVuIGBtZXRob2RgIGFuZCBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHVybFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBSZXF1ZXN0KG1ldGhvZCwgdXJsKSB7XG4gIFN0cmVhbS5jYWxsKHRoaXMpO1xuICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHVybCA9IGZvcm1hdCh1cmwpO1xuICB0aGlzLl9lbmFibGVIdHRwMiA9IEJvb2xlYW4ocHJvY2Vzcy5lbnYuSFRUUDJfVEVTVCk7IC8vIGludGVybmFsIG9ubHlcbiAgdGhpcy5fYWdlbnQgPSBmYWxzZTtcbiAgdGhpcy5fZm9ybURhdGEgPSBudWxsO1xuICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgdGhpcy51cmwgPSB1cmw7XG4gIF9pbml0SGVhZGVycyh0aGlzKTtcbiAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gIHRoaXMuX3JlZGlyZWN0cyA9IDA7XG4gIHRoaXMucmVkaXJlY3RzKG1ldGhvZCA9PT0gJ0hFQUQnID8gMCA6IDUpO1xuICB0aGlzLmNvb2tpZXMgPSAnJztcbiAgdGhpcy5xcyA9IHt9O1xuICB0aGlzLl9xdWVyeSA9IFtdO1xuICB0aGlzLnFzUmF3ID0gdGhpcy5fcXVlcnk7IC8vIFVudXNlZCwgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IG9ubHlcbiAgdGhpcy5fcmVkaXJlY3RMaXN0ID0gW107XG4gIHRoaXMuX3N0cmVhbVJlcXVlc3QgPSBmYWxzZTtcbiAgdGhpcy5fbG9va3VwID0gdW5kZWZpbmVkO1xuICB0aGlzLm9uY2UoJ2VuZCcsIHRoaXMuY2xlYXJUaW1lb3V0LmJpbmQodGhpcykpO1xufVxuXG4vKipcbiAqIEluaGVyaXQgZnJvbSBgU3RyZWFtYCAod2hpY2ggaW5oZXJpdHMgZnJvbSBgRXZlbnRFbWl0dGVyYCkuXG4gKiBNaXhpbiBgUmVxdWVzdEJhc2VgLlxuICovXG51dGlsLmluaGVyaXRzKFJlcXVlc3QsIFN0cmVhbSk7XG5cbm1peGluKFJlcXVlc3QucHJvdG90eXBlLCBSZXF1ZXN0QmFzZS5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEVuYWJsZSBvciBEaXNhYmxlIGh0dHAyLlxuICpcbiAqIEVuYWJsZSBodHRwMi5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QuZ2V0KCdodHRwOi8vbG9jYWxob3N0LycpXG4gKiAgIC5odHRwMigpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIHJlcXVlc3QuZ2V0KCdodHRwOi8vbG9jYWxob3N0LycpXG4gKiAgIC5odHRwMih0cnVlKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIERpc2FibGUgaHR0cDIuXG4gKlxuICogYGBgIGpzXG4gKiByZXF1ZXN0ID0gcmVxdWVzdC5odHRwMigpO1xuICogcmVxdWVzdC5nZXQoJ2h0dHA6Ly9sb2NhbGhvc3QvJylcbiAqICAgLmh0dHAyKGZhbHNlKVxuICogICAuZW5kKGNhbGxiYWNrKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZW5hYmxlXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuaHR0cDIgPSBmdW5jdGlvbiAoYm9vbCkge1xuICBpZiAoZXhwb3J0cy5wcm90b2NvbHNbJ2h0dHAyOiddID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnc3VwZXJhZ2VudDogdGhpcyB2ZXJzaW9uIG9mIE5vZGUuanMgZG9lcyBub3Qgc3VwcG9ydCBodHRwMidcbiAgICApO1xuICB9XG5cbiAgdGhpcy5fZW5hYmxlSHR0cDIgPSBib29sID09PSB1bmRlZmluZWQgPyB0cnVlIDogYm9vbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFF1ZXVlIHRoZSBnaXZlbiBgZmlsZWAgYXMgYW4gYXR0YWNobWVudCB0byB0aGUgc3BlY2lmaWVkIGBmaWVsZGAsXG4gKiB3aXRoIG9wdGlvbmFsIGBvcHRpb25zYCAob3IgZmlsZW5hbWUpLlxuICpcbiAqIGBgYCBqc1xuICogcmVxdWVzdC5wb3N0KCdodHRwOi8vbG9jYWxob3N0L3VwbG9hZCcpXG4gKiAgIC5hdHRhY2goJ2ZpZWxkJywgQnVmZmVyLmZyb20oJzxiPkhlbGxvIHdvcmxkPC9iPicpLCAnaGVsbG8uaHRtbCcpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQSBmaWxlbmFtZSBtYXkgYWxzbyBiZSB1c2VkOlxuICpcbiAqIGBgYCBqc1xuICogcmVxdWVzdC5wb3N0KCdodHRwOi8vbG9jYWxob3N0L3VwbG9hZCcpXG4gKiAgIC5hdHRhY2goJ2ZpbGVzJywgJ2ltYWdlLmpwZycpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcGFyYW0ge1N0cmluZ3xmcy5SZWFkU3RyZWFtfEJ1ZmZlcn0gZmlsZVxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24gKGZpZWxkLCBmaWxlLCBvcHRpb25zKSB7XG4gIGlmIChmaWxlKSB7XG4gICAgaWYgKHRoaXMuX2RhdGEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInN1cGVyYWdlbnQgY2FuJ3QgbWl4IC5zZW5kKCkgYW5kIC5hdHRhY2goKVwiKTtcbiAgICB9XG5cbiAgICBsZXQgbyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgbyA9IHsgZmlsZW5hbWU6IG9wdGlvbnMgfTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZpbGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAoIW8uZmlsZW5hbWUpIG8uZmlsZW5hbWUgPSBmaWxlO1xuICAgICAgZGVidWcoJ2NyZWF0aW5nIGBmcy5SZWFkU3RyZWFtYCBpbnN0YW5jZSBmb3IgZmlsZTogJXMnLCBmaWxlKTtcbiAgICAgIGZpbGUgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGUpO1xuICAgICAgZmlsZS5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSB0aGlzLl9nZXRGb3JtRGF0YSgpO1xuICAgICAgICBmb3JtRGF0YS5lbWl0KCdlcnJvcicsIGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIW8uZmlsZW5hbWUgJiYgZmlsZS5wYXRoKSB7XG4gICAgICBvLmZpbGVuYW1lID0gZmlsZS5wYXRoO1xuICAgIH1cblxuICAgIHRoaXMuX2dldEZvcm1EYXRhKCkuYXBwZW5kKGZpZWxkLCBmaWxlLCBvKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuX2dldEZvcm1EYXRhID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuX2Zvcm1EYXRhKSB7XG4gICAgdGhpcy5fZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB0aGlzLl9mb3JtRGF0YS5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIGRlYnVnKCdGb3JtRGF0YSBlcnJvcicsIGVycm9yKTtcbiAgICAgIGlmICh0aGlzLmNhbGxlZCkge1xuICAgICAgICAvLyBUaGUgcmVxdWVzdCBoYXMgYWxyZWFkeSBmaW5pc2hlZCBhbmQgdGhlIGNhbGxiYWNrIHdhcyBjYWxsZWQuXG4gICAgICAgIC8vIFNpbGVudGx5IGlnbm9yZSB0aGUgZXJyb3IuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jYWxsYmFjayhlcnJvcik7XG4gICAgICB0aGlzLmFib3J0KCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5fZm9ybURhdGE7XG59O1xuXG4vKipcbiAqIEdldHMvc2V0cyB0aGUgYEFnZW50YCB0byB1c2UgZm9yIHRoaXMgSFRUUCByZXF1ZXN0LiBUaGUgZGVmYXVsdCAoaWYgdGhpc1xuICogZnVuY3Rpb24gaXMgbm90IGNhbGxlZCkgaXMgdG8gb3B0IG91dCBvZiBjb25uZWN0aW9uIHBvb2xpbmcgKGBhZ2VudDogZmFsc2VgKS5cbiAqXG4gKiBAcGFyYW0ge2h0dHAuQWdlbnR9IGFnZW50XG4gKiBAcmV0dXJuIHtodHRwLkFnZW50fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hZ2VudCA9IGZ1bmN0aW9uIChhZ2VudCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuX2FnZW50O1xuICB0aGlzLl9hZ2VudCA9IGFnZW50O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0cy9zZXRzIHRoZSBgbG9va3VwYCBmdW5jdGlvbiB0byB1c2UgY3VzdG9tIEROUyByZXNvbHZlci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsb29rdXBcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiAobG9va3VwKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdGhpcy5fbG9va3VwO1xuICB0aGlzLl9sb29rdXAgPSBsb29rdXA7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgX0NvbnRlbnQtVHlwZV8gcmVzcG9uc2UgaGVhZGVyIHBhc3NlZCB0aHJvdWdoIGBtaW1lLmdldFR5cGUoKWAuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICByZXF1ZXN0LnBvc3QoJy8nKVxuICogICAgICAgIC50eXBlKCd4bWwnKVxuICogICAgICAgIC5zZW5kKHhtbHN0cmluZylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcXVlc3QucG9zdCgnLycpXG4gKiAgICAgICAgLnR5cGUoJ2pzb24nKVxuICogICAgICAgIC5zZW5kKGpzb25zdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LnBvc3QoJy8nKVxuICogICAgICAgIC50eXBlKCdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuc2VuZChqc29uc3RyaW5nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudHlwZSA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gIHJldHVybiB0aGlzLnNldChcbiAgICAnQ29udGVudC1UeXBlJyxcbiAgICB0eXBlLmluY2x1ZGVzKCcvJykgPyB0eXBlIDogbWltZS5nZXRUeXBlKHR5cGUpXG4gICk7XG59O1xuXG4vKipcbiAqIFNldCBfQWNjZXB0XyByZXNwb25zZSBoZWFkZXIgcGFzc2VkIHRocm91Z2ggYG1pbWUuZ2V0VHlwZSgpYC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHN1cGVyYWdlbnQudHlwZXMuanNvbiA9ICdhcHBsaWNhdGlvbi9qc29uJztcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvYWdlbnQnKVxuICogICAgICAgIC5hY2NlcHQoJ2pzb24nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqICAgICAgcmVxdWVzdC5nZXQoJy9hZ2VudCcpXG4gKiAgICAgICAgLmFjY2VwdCgnYXBwbGljYXRpb24vanNvbicpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjY2VwdFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmFjY2VwdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gIHJldHVybiB0aGlzLnNldCgnQWNjZXB0JywgdHlwZS5pbmNsdWRlcygnLycpID8gdHlwZSA6IG1pbWUuZ2V0VHlwZSh0eXBlKSk7XG59O1xuXG4vKipcbiAqIEFkZCBxdWVyeS1zdHJpbmcgYHZhbGAuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICByZXF1ZXN0LmdldCgnL3Nob2VzJylcbiAqICAgICAucXVlcnkoJ3NpemU9MTAnKVxuICogICAgIC5xdWVyeSh7IGNvbG9yOiAnYmx1ZScgfSlcbiAqXG4gKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5fcXVlcnkucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnFzLCB2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogV3JpdGUgcmF3IGBkYXRhYCAvIGBlbmNvZGluZ2AgdG8gdGhlIHNvY2tldC5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlcnxTdHJpbmd9IGRhdGFcbiAqIEBwYXJhbSB7U3RyaW5nfSBlbmNvZGluZ1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoZGF0YSwgZW5jb2RpbmcpIHtcbiAgY29uc3QgcmVxdWVzdF8gPSB0aGlzLnJlcXVlc3QoKTtcbiAgaWYgKCF0aGlzLl9zdHJlYW1SZXF1ZXN0KSB7XG4gICAgdGhpcy5fc3RyZWFtUmVxdWVzdCA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gcmVxdWVzdF8ud3JpdGUoZGF0YSwgZW5jb2RpbmcpO1xufTtcblxuLyoqXG4gKiBQaXBlIHRoZSByZXF1ZXN0IGJvZHkgdG8gYHN0cmVhbWAuXG4gKlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIChzdHJlYW0sIG9wdGlvbnMpIHtcbiAgdGhpcy5waXBlZCA9IHRydWU7IC8vIEhBQ0suLi5cbiAgdGhpcy5idWZmZXIoZmFsc2UpO1xuICB0aGlzLmVuZCgpO1xuICByZXR1cm4gdGhpcy5fcGlwZUNvbnRpbnVlKHN0cmVhbSwgb3B0aW9ucyk7XG59O1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fcGlwZUNvbnRpbnVlID0gZnVuY3Rpb24gKHN0cmVhbSwgb3B0aW9ucykge1xuICB0aGlzLnJlcS5vbmNlKCdyZXNwb25zZScsIChyZXMpID0+IHtcbiAgICAvLyByZWRpcmVjdFxuICAgIGlmIChcbiAgICAgIGlzUmVkaXJlY3QocmVzLnN0YXR1c0NvZGUpICYmXG4gICAgICB0aGlzLl9yZWRpcmVjdHMrKyAhPT0gdGhpcy5fbWF4UmVkaXJlY3RzXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVkaXJlY3QocmVzKSA9PT0gdGhpc1xuICAgICAgICA/IHRoaXMuX3BpcGVDb250aW51ZShzdHJlYW0sIG9wdGlvbnMpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMucmVzID0gcmVzO1xuICAgIHRoaXMuX2VtaXRSZXNwb25zZSgpO1xuICAgIGlmICh0aGlzLl9hYm9ydGVkKSByZXR1cm47XG5cbiAgICBpZiAodGhpcy5fc2hvdWxkVW56aXAocmVzKSkge1xuICAgICAgY29uc3QgdW56aXBPYmplY3QgPSB6bGliLmNyZWF0ZVVuemlwKCk7XG4gICAgICB1bnppcE9iamVjdC5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGVycm9yICYmIGVycm9yLmNvZGUgPT09ICdaX0JVRl9FUlJPUicpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIGVuZCBvZiBmaWxlIGlzIGlnbm9yZWQgYnkgYnJvd3NlcnMgYW5kIGN1cmxcbiAgICAgICAgICBzdHJlYW0uZW1pdCgnZW5kJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyb3IpO1xuICAgICAgfSk7XG4gICAgICByZXMucGlwZSh1bnppcE9iamVjdCkucGlwZShzdHJlYW0sIG9wdGlvbnMpO1xuICAgICAgLy8gZG9uJ3QgZW1pdCAnZW5kJyB1bnRpbCB1bnppcE9iamVjdCBoYXMgY29tcGxldGVkIHdyaXRpbmcgYWxsIGl0cyBkYXRhLlxuICAgICAgdW56aXBPYmplY3Qub25jZSgnZW5kJywgKCkgPT4gdGhpcy5lbWl0KCdlbmQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5waXBlKHN0cmVhbSwgb3B0aW9ucyk7XG4gICAgICByZXMub25jZSgnZW5kJywgKCkgPT4gdGhpcy5lbWl0KCdlbmQnKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHN0cmVhbTtcbn07XG5cbi8qKlxuICogRW5hYmxlIC8gZGlzYWJsZSBidWZmZXJpbmcuXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gW3ZhbF1cbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5idWZmZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdGhpcy5fYnVmZmVyID0gdmFsdWUgIT09IGZhbHNlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVkaXJlY3QgdG8gYHVybFxuICpcbiAqIEBwYXJhbSB7SW5jb21pbmdNZXNzYWdlfSByZXNcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuX3JlZGlyZWN0ID0gZnVuY3Rpb24gKHJlcykge1xuICBsZXQgdXJsID0gcmVzLmhlYWRlcnMubG9jYXRpb247XG4gIGlmICghdXJsKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbGJhY2sobmV3IEVycm9yKCdObyBsb2NhdGlvbiBoZWFkZXIgZm9yIHJlZGlyZWN0JyksIHJlcyk7XG4gIH1cblxuICBkZWJ1ZygncmVkaXJlY3QgJXMgLT4gJXMnLCB0aGlzLnVybCwgdXJsKTtcblxuICAvLyBsb2NhdGlvblxuICB1cmwgPSBuZXcgVVJMKHVybCwgdGhpcy51cmwpLmhyZWY7XG5cbiAgLy8gZW5zdXJlIHRoZSByZXNwb25zZSBpcyBiZWluZyBjb25zdW1lZFxuICAvLyB0aGlzIGlzIHJlcXVpcmVkIGZvciBOb2RlIHYwLjEwK1xuICByZXMucmVzdW1lKCk7XG5cbiAgbGV0IGhlYWRlcnMgPSB0aGlzLnJlcS5nZXRIZWFkZXJzID8gdGhpcy5yZXEuZ2V0SGVhZGVycygpIDogdGhpcy5yZXEuX2hlYWRlcnM7XG5cbiAgY29uc3QgY2hhbmdlc09yaWdpbiA9IG5ldyBVUkwodXJsKS5ob3N0ICE9PSBuZXcgVVJMKHRoaXMudXJsKS5ob3N0O1xuXG4gIC8vIGltcGxlbWVudGF0aW9uIG9mIDMwMiBmb2xsb3dpbmcgZGVmYWN0byBzdGFuZGFyZFxuICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDMwMSB8fCByZXMuc3RhdHVzQ29kZSA9PT0gMzAyKSB7XG4gICAgLy8gc3RyaXAgQ29udGVudC0qIHJlbGF0ZWQgZmllbGRzXG4gICAgLy8gaW4gY2FzZSBvZiBQT1NUIGV0Y1xuICAgIGhlYWRlcnMgPSB1dGlscy5jbGVhbkhlYWRlcihoZWFkZXJzLCBjaGFuZ2VzT3JpZ2luKTtcblxuICAgIC8vIGZvcmNlIEdFVFxuICAgIHRoaXMubWV0aG9kID0gdGhpcy5tZXRob2QgPT09ICdIRUFEJyA/ICdIRUFEJyA6ICdHRVQnO1xuXG4gICAgLy8gY2xlYXIgZGF0YVxuICAgIHRoaXMuX2RhdGEgPSBudWxsO1xuICB9XG5cbiAgLy8gMzAzIGlzIGFsd2F5cyBHRVRcbiAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAzMDMpIHtcbiAgICAvLyBzdHJpcCBDb250ZW50LSogcmVsYXRlZCBmaWVsZHNcbiAgICAvLyBpbiBjYXNlIG9mIFBPU1QgZXRjXG4gICAgaGVhZGVycyA9IHV0aWxzLmNsZWFuSGVhZGVyKGhlYWRlcnMsIGNoYW5nZXNPcmlnaW4pO1xuXG4gICAgLy8gZm9yY2UgbWV0aG9kXG4gICAgdGhpcy5tZXRob2QgPSAnR0VUJztcblxuICAgIC8vIGNsZWFyIGRhdGFcbiAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgfVxuXG4gIC8vIDMwNyBwcmVzZXJ2ZXMgbWV0aG9kXG4gIC8vIDMwOCBwcmVzZXJ2ZXMgbWV0aG9kXG4gIGRlbGV0ZSBoZWFkZXJzLmhvc3Q7XG5cbiAgZGVsZXRlIHRoaXMucmVxO1xuICBkZWxldGUgdGhpcy5fZm9ybURhdGE7XG5cbiAgLy8gcmVtb3ZlIGFsbCBhZGQgaGVhZGVyIGV4Y2VwdCBVc2VyLUFnZW50XG4gIF9pbml0SGVhZGVycyh0aGlzKTtcblxuICAvLyByZWRpcmVjdFxuICB0aGlzLnJlcyA9IHJlcztcbiAgdGhpcy5fZW5kQ2FsbGVkID0gZmFsc2U7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLnFzID0ge307XG4gIHRoaXMuX3F1ZXJ5Lmxlbmd0aCA9IDA7XG4gIHRoaXMuc2V0KGhlYWRlcnMpO1xuICB0aGlzLl9lbWl0UmVkaXJlY3QoKTtcbiAgdGhpcy5fcmVkaXJlY3RMaXN0LnB1c2godGhpcy51cmwpO1xuICB0aGlzLmVuZCh0aGlzLl9jYWxsYmFjayk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgQXV0aG9yaXphdGlvbiBmaWVsZCB2YWx1ZSB3aXRoIGB1c2VyYCBhbmQgYHBhc3NgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgLmF1dGgoJ3RvYmknLCAnbGVhcm5ib29zdCcpXG4gKiAgIC5hdXRoKCd0b2JpOmxlYXJuYm9vc3QnKVxuICogICAuYXV0aCgndG9iaScpXG4gKiAgIC5hdXRoKGFjY2Vzc1Rva2VuLCB7IHR5cGU6ICdiZWFyZXInIH0pXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbcGFzc11cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gb3B0aW9ucyB3aXRoIGF1dGhvcml6YXRpb24gdHlwZSAnYmFzaWMnIG9yICdiZWFyZXInICgnYmFzaWMnIGlzIGRlZmF1bHQpXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXV0aCA9IGZ1bmN0aW9uICh1c2VyLCBwYXNzLCBvcHRpb25zKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSBwYXNzID0gJyc7XG4gIGlmICh0eXBlb2YgcGFzcyA9PT0gJ29iamVjdCcgJiYgcGFzcyAhPT0gbnVsbCkge1xuICAgIC8vIHBhc3MgaXMgb3B0aW9uYWwgYW5kIGNhbiBiZSByZXBsYWNlZCB3aXRoIG9wdGlvbnNcbiAgICBvcHRpb25zID0gcGFzcztcbiAgICBwYXNzID0gJyc7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0geyB0eXBlOiAnYmFzaWMnIH07XG4gIH1cblxuICBjb25zdCBlbmNvZGVyID0gKHN0cmluZykgPT4gQnVmZmVyLmZyb20oc3RyaW5nKS50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgcmV0dXJuIHRoaXMuX2F1dGgodXNlciwgcGFzcywgb3B0aW9ucywgZW5jb2Rlcik7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY2VydGlmaWNhdGUgYXV0aG9yaXR5IG9wdGlvbiBmb3IgaHR0cHMgcmVxdWVzdC5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlciB8IEFycmF5fSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2EgPSBmdW5jdGlvbiAoY2VydCkge1xuICB0aGlzLl9jYSA9IGNlcnQ7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNsaWVudCBjZXJ0aWZpY2F0ZSBrZXkgb3B0aW9uIGZvciBodHRwcyByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyIHwgU3RyaW5nfSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUua2V5ID0gZnVuY3Rpb24gKGNlcnQpIHtcbiAgdGhpcy5fa2V5ID0gY2VydDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUga2V5LCBjZXJ0aWZpY2F0ZSwgYW5kIENBIGNlcnRzIG9mIHRoZSBjbGllbnQgaW4gUEZYIG9yIFBLQ1MxMiBmb3JtYXQuXG4gKlxuICogQHBhcmFtIHtCdWZmZXIgfCBTdHJpbmd9IGNlcnRcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5wZnggPSBmdW5jdGlvbiAoY2VydCkge1xuICBpZiAodHlwZW9mIGNlcnQgPT09ICdvYmplY3QnICYmICFCdWZmZXIuaXNCdWZmZXIoY2VydCkpIHtcbiAgICB0aGlzLl9wZnggPSBjZXJ0LnBmeDtcbiAgICB0aGlzLl9wYXNzcGhyYXNlID0gY2VydC5wYXNzcGhyYXNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3BmeCA9IGNlcnQ7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjbGllbnQgY2VydGlmaWNhdGUgb3B0aW9uIGZvciBodHRwcyByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyIHwgU3RyaW5nfSBjZXJ0XG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuY2VydCA9IGZ1bmN0aW9uIChjZXJ0KSB7XG4gIHRoaXMuX2NlcnQgPSBjZXJ0O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRG8gbm90IHJlamVjdCBleHBpcmVkIG9yIGludmFsaWQgVExTIGNlcnRzLlxuICogc2V0cyBgcmVqZWN0VW5hdXRob3JpemVkPXRydWVgLiBCZSB3YXJuZWQgdGhhdCB0aGlzIGFsbG93cyBNSVRNIGF0dGFja3MuXG4gKlxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmRpc2FibGVUTFNDZXJ0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fZGlzYWJsZVRMU0NlcnRzID0gdHJ1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhbiBodHRwW3NdIHJlcXVlc3QuXG4gKlxuICogQHJldHVybiB7T3V0Z29pbmdNZXNzYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcblJlcXVlc3QucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnJlcSkgcmV0dXJuIHRoaXMucmVxO1xuXG4gIGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuICB0cnkge1xuICAgIGNvbnN0IHF1ZXJ5ID0gcXMuc3RyaW5naWZ5KHRoaXMucXMsIHtcbiAgICAgIGluZGljZXM6IGZhbHNlLFxuICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nOiB0cnVlXG4gICAgfSk7XG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICB0aGlzLnFzID0ge307XG4gICAgICB0aGlzLl9xdWVyeS5wdXNoKHF1ZXJ5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9maW5hbGl6ZVF1ZXJ5U3RyaW5nKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuXG4gIGxldCB7IHVybDogdXJsU3RyaW5nIH0gPSB0aGlzO1xuICBjb25zdCByZXRyaWVzID0gdGhpcy5fcmV0cmllcztcblxuICAvLyBkZWZhdWx0IHRvIGh0dHA6Ly9cbiAgaWYgKHVybFN0cmluZy5pbmRleE9mKCdodHRwJykgIT09IDApIHVybFN0cmluZyA9IGBodHRwOi8vJHt1cmxTdHJpbmd9YDtcbiAgY29uc3QgdXJsID0gbmV3IFVSTCh1cmxTdHJpbmcpO1xuICBsZXQgeyBwcm90b2NvbCB9ID0gdXJsO1xuICBsZXQgcGF0aCA9IGAke3VybC5wYXRobmFtZX0ke3VybC5zZWFyY2h9YDtcblxuICAvLyBzdXBwb3J0IHVuaXggc29ja2V0c1xuICBpZiAoL15odHRwcz9cXCt1bml4Oi8udGVzdChwcm90b2NvbCkgPT09IHRydWUpIHtcbiAgICAvLyBnZXQgdGhlIHByb3RvY29sXG4gICAgcHJvdG9jb2wgPSBgJHtwcm90b2NvbC5zcGxpdCgnKycpWzBdfTpgO1xuXG4gICAgLy8gZ2V0IHRoZSBzb2NrZXQgcGF0aFxuICAgIG9wdGlvbnMuc29ja2V0UGF0aCA9IHVybC5ob3N0bmFtZS5yZXBsYWNlKC8lMkYvZywgJy8nKTtcbiAgICB1cmwuaG9zdCA9ICcnO1xuICAgIHVybC5ob3N0bmFtZSA9ICcnO1xuICB9XG5cbiAgLy8gT3ZlcnJpZGUgSVAgYWRkcmVzcyBvZiBhIGhvc3RuYW1lXG4gIGlmICh0aGlzLl9jb25uZWN0T3ZlcnJpZGUpIHtcbiAgICBjb25zdCB7IGhvc3RuYW1lIH0gPSB1cmw7XG4gICAgY29uc3QgbWF0Y2ggPVxuICAgICAgaG9zdG5hbWUgaW4gdGhpcy5fY29ubmVjdE92ZXJyaWRlXG4gICAgICAgID8gdGhpcy5fY29ubmVjdE92ZXJyaWRlW2hvc3RuYW1lXVxuICAgICAgICA6IHRoaXMuX2Nvbm5lY3RPdmVycmlkZVsnKiddO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgLy8gYmFja3VwIHRoZSByZWFsIGhvc3RcbiAgICAgIGlmICghdGhpcy5faGVhZGVyLmhvc3QpIHtcbiAgICAgICAgdGhpcy5zZXQoJ2hvc3QnLCB1cmwuaG9zdCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBuZXdIb3N0O1xuICAgICAgbGV0IG5ld1BvcnQ7XG5cbiAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG5ld0hvc3QgPSBtYXRjaC5ob3N0O1xuICAgICAgICBuZXdQb3J0ID0gbWF0Y2gucG9ydDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0hvc3QgPSBtYXRjaDtcbiAgICAgICAgbmV3UG9ydCA9IHVybC5wb3J0O1xuICAgICAgfVxuXG4gICAgICAvLyB3cmFwIFtpcHY2XVxuICAgICAgdXJsLmhvc3QgPSAvOi8udGVzdChuZXdIb3N0KSA/IGBbJHtuZXdIb3N0fV1gIDogbmV3SG9zdDtcbiAgICAgIGlmIChuZXdQb3J0KSB7XG4gICAgICAgIHVybC5ob3N0ICs9IGA6JHtuZXdQb3J0fWA7XG4gICAgICAgIHVybC5wb3J0ID0gbmV3UG9ydDtcbiAgICAgIH1cblxuICAgICAgdXJsLmhvc3RuYW1lID0gbmV3SG9zdDtcbiAgICB9XG4gIH1cblxuICAvLyBvcHRpb25zXG4gIG9wdGlvbnMubWV0aG9kID0gdGhpcy5tZXRob2Q7XG4gIG9wdGlvbnMucG9ydCA9IHVybC5wb3J0O1xuICBvcHRpb25zLnBhdGggPSBwYXRoO1xuICBvcHRpb25zLmhvc3QgPSB1cmwuaG9zdG5hbWU7XG4gIG9wdGlvbnMuY2EgPSB0aGlzLl9jYTtcbiAgb3B0aW9ucy5rZXkgPSB0aGlzLl9rZXk7XG4gIG9wdGlvbnMucGZ4ID0gdGhpcy5fcGZ4O1xuICBvcHRpb25zLmNlcnQgPSB0aGlzLl9jZXJ0O1xuICBvcHRpb25zLnBhc3NwaHJhc2UgPSB0aGlzLl9wYXNzcGhyYXNlO1xuICBvcHRpb25zLmFnZW50ID0gdGhpcy5fYWdlbnQ7XG4gIG9wdGlvbnMubG9va3VwID0gdGhpcy5fbG9va3VwO1xuICBvcHRpb25zLnJlamVjdFVuYXV0aG9yaXplZCA9XG4gICAgdHlwZW9mIHRoaXMuX2Rpc2FibGVUTFNDZXJ0cyA9PT0gJ2Jvb2xlYW4nXG4gICAgICA/ICF0aGlzLl9kaXNhYmxlVExTQ2VydHNcbiAgICAgIDogcHJvY2Vzcy5lbnYuTk9ERV9UTFNfUkVKRUNUX1VOQVVUSE9SSVpFRCAhPT0gJzAnO1xuXG4gIC8vIEFsbG93cyByZXF1ZXN0LmdldCgnaHR0cHM6Ly8xLjIuMy40LycpLnNldCgnSG9zdCcsICdleGFtcGxlLmNvbScpXG4gIGlmICh0aGlzLl9oZWFkZXIuaG9zdCkge1xuICAgIG9wdGlvbnMuc2VydmVybmFtZSA9IHRoaXMuX2hlYWRlci5ob3N0LnJlcGxhY2UoLzpcXGQrJC8sICcnKTtcbiAgfVxuXG4gIGlmIChcbiAgICB0aGlzLl90cnVzdExvY2FsaG9zdCAmJlxuICAgIC9eKD86bG9jYWxob3N0fDEyN1xcLjBcXC4wXFwuXFxkK3woMCo6KSs6MCoxKSQvLnRlc3QodXJsLmhvc3RuYW1lKVxuICApIHtcbiAgICBvcHRpb25zLnJlamVjdFVuYXV0aG9yaXplZCA9IGZhbHNlO1xuICB9XG5cbiAgLy8gaW5pdGlhdGUgcmVxdWVzdFxuICBjb25zdCBtb2R1bGVfID0gdGhpcy5fZW5hYmxlSHR0cDJcbiAgICA/IGV4cG9ydHMucHJvdG9jb2xzWydodHRwMjonXS5zZXRQcm90b2NvbChwcm90b2NvbClcbiAgICA6IGV4cG9ydHMucHJvdG9jb2xzW3Byb3RvY29sXTtcblxuICAvLyByZXF1ZXN0XG4gIHRoaXMucmVxID0gbW9kdWxlXy5yZXF1ZXN0KG9wdGlvbnMpO1xuICBjb25zdCB7IHJlcSB9ID0gdGhpcztcblxuICAvLyBzZXQgdGNwIG5vIGRlbGF5XG4gIHJlcS5zZXROb0RlbGF5KHRydWUpO1xuXG4gIGlmIChvcHRpb25zLm1ldGhvZCAhPT0gJ0hFQUQnKSB7XG4gICAgcmVxLnNldEhlYWRlcignQWNjZXB0LUVuY29kaW5nJywgJ2d6aXAsIGRlZmxhdGUnKTtcbiAgfVxuXG4gIHRoaXMucHJvdG9jb2wgPSBwcm90b2NvbDtcbiAgdGhpcy5ob3N0ID0gdXJsLmhvc3Q7XG5cbiAgLy8gZXhwb3NlIGV2ZW50c1xuICByZXEub25jZSgnZHJhaW4nLCAoKSA9PiB7XG4gICAgdGhpcy5lbWl0KCdkcmFpbicpO1xuICB9KTtcblxuICByZXEub24oJ2Vycm9yJywgKGVycm9yKSA9PiB7XG4gICAgLy8gZmxhZyBhYm9ydGlvbiBoZXJlIGZvciBvdXQgdGltZW91dHNcbiAgICAvLyBiZWNhdXNlIG5vZGUgd2lsbCBlbWl0IGEgZmF1eC1lcnJvciBcInNvY2tldCBoYW5nIHVwXCJcbiAgICAvLyB3aGVuIHJlcXVlc3QgaXMgYWJvcnRlZCBiZWZvcmUgYSBjb25uZWN0aW9uIGlzIG1hZGVcbiAgICBpZiAodGhpcy5fYWJvcnRlZCkgcmV0dXJuO1xuICAgIC8vIGlmIG5vdCB0aGUgc2FtZSwgd2UgYXJlIGluIHRoZSAqKm9sZCoqIChjYW5jZWxsZWQpIHJlcXVlc3QsXG4gICAgLy8gc28gbmVlZCB0byBjb250aW51ZSAoc2FtZSBhcyBmb3IgYWJvdmUpXG4gICAgaWYgKHRoaXMuX3JldHJpZXMgIT09IHJldHJpZXMpIHJldHVybjtcbiAgICAvLyBpZiB3ZSd2ZSByZWNlaXZlZCBhIHJlc3BvbnNlIHRoZW4gd2UgZG9uJ3Qgd2FudCB0byBsZXRcbiAgICAvLyBhbiBlcnJvciBpbiB0aGUgcmVxdWVzdCBibG93IHVwIHRoZSByZXNwb25zZVxuICAgIGlmICh0aGlzLnJlc3BvbnNlKSByZXR1cm47XG4gICAgdGhpcy5jYWxsYmFjayhlcnJvcik7XG4gIH0pO1xuXG4gIC8vIGF1dGhcbiAgaWYgKHVybC51c2VybmFtZSB8fCB1cmwucGFzc3dvcmQpIHtcbiAgICB0aGlzLmF1dGgodXJsLnVzZXJuYW1lLCB1cmwucGFzc3dvcmQpO1xuICB9XG5cbiAgaWYgKHRoaXMudXNlcm5hbWUgJiYgdGhpcy5wYXNzd29yZCkge1xuICAgIHRoaXMuYXV0aCh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IGluIHRoaXMuaGVhZGVyKSB7XG4gICAgaWYgKGhhc093bih0aGlzLmhlYWRlciwga2V5KSkgcmVxLnNldEhlYWRlcihrZXksIHRoaXMuaGVhZGVyW2tleV0pO1xuICB9XG5cbiAgLy8gYWRkIGNvb2tpZXNcbiAgaWYgKHRoaXMuY29va2llcykge1xuICAgIGlmIChoYXNPd24odGhpcy5faGVhZGVyLCAnY29va2llJykpIHtcbiAgICAgIC8vIG1lcmdlXG4gICAgICBjb25zdCB0ZW1wb3JhcnlKYXIgPSBuZXcgQ29va2llSmFyLkNvb2tpZUphcigpO1xuICAgICAgdGVtcG9yYXJ5SmFyLnNldENvb2tpZXModGhpcy5faGVhZGVyLmNvb2tpZS5zcGxpdCgnOyAnKSk7XG4gICAgICB0ZW1wb3JhcnlKYXIuc2V0Q29va2llcyh0aGlzLmNvb2tpZXMuc3BsaXQoJzsgJykpO1xuICAgICAgcmVxLnNldEhlYWRlcihcbiAgICAgICAgJ0Nvb2tpZScsXG4gICAgICAgIHRlbXBvcmFyeUphci5nZXRDb29raWVzKENvb2tpZUphci5Db29raWVBY2Nlc3NJbmZvLkFsbCkudG9WYWx1ZVN0cmluZygpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXEuc2V0SGVhZGVyKCdDb29raWUnLCB0aGlzLmNvb2tpZXMpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIEludm9rZSB0aGUgY2FsbGJhY2sgd2l0aCBgZXJyYCBhbmQgYHJlc2BcbiAqIGFuZCBoYW5kbGUgYXJpdHkgY2hlY2suXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcGFyYW0ge1Jlc3BvbnNlfSByZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmNhbGxiYWNrID0gZnVuY3Rpb24gKGVycm9yLCByZXMpIHtcbiAgaWYgKHRoaXMuX3Nob3VsZFJldHJ5KGVycm9yLCByZXMpKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JldHJ5KCk7XG4gIH1cblxuICAvLyBBdm9pZCB0aGUgZXJyb3Igd2hpY2ggaXMgZW1pdHRlZCBmcm9tICdzb2NrZXQgaGFuZyB1cCcgdG8gY2F1c2UgdGhlIGZuIHVuZGVmaW5lZCBlcnJvciBvbiBKUyBydW50aW1lLlxuICBjb25zdCBmbiA9IHRoaXMuX2NhbGxiYWNrIHx8IG5vb3A7XG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG4gIGlmICh0aGlzLmNhbGxlZCkgcmV0dXJuIGNvbnNvbGUud2Fybignc3VwZXJhZ2VudDogZG91YmxlIGNhbGxiYWNrIGJ1ZycpO1xuICB0aGlzLmNhbGxlZCA9IHRydWU7XG5cbiAgaWYgKCFlcnJvcikge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuX2lzUmVzcG9uc2VPSyhyZXMpKSB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gJ1Vuc3VjY2Vzc2Z1bCBIVFRQIHJlc3BvbnNlJztcbiAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgIG1lc3NhZ2UgPSBodHRwLlNUQVRVU19DT0RFU1tyZXMuc3RhdHVzXSB8fCBtZXNzYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIGVycm9yLnN0YXR1cyA9IHJlcyA/IHJlcy5zdGF0dXMgOiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBlcnJvciA9IGVycjtcbiAgICAgIGVycm9yLnN0YXR1cyA9IGVycm9yLnN0YXR1cyB8fCAocmVzID8gcmVzLnN0YXR1cyA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB0aGUgY2FsbGJhY2sgaXMgY2FsbGVkIG91dHNpZGUgdHJ5L2NhdGNoXG4gIC8vIHRvIGF2b2lkIGRvdWJsZSBjYWxsYmFja1xuICBpZiAoIWVycm9yKSB7XG4gICAgcmV0dXJuIGZuKG51bGwsIHJlcyk7XG4gIH1cblxuICBlcnJvci5yZXNwb25zZSA9IHJlcztcbiAgaWYgKHRoaXMuX21heFJldHJpZXMpIGVycm9yLnJldHJpZXMgPSB0aGlzLl9yZXRyaWVzIC0gMTtcblxuICAvLyBvbmx5IGVtaXQgZXJyb3IgZXZlbnQgaWYgdGhlcmUgaXMgYSBsaXN0ZW5lclxuICAvLyBvdGhlcndpc2Ugd2UgYXNzdW1lIHRoZSBjYWxsYmFjayB0byBgLmVuZCgpYCB3aWxsIGdldCB0aGUgZXJyb3JcbiAgaWYgKGVycm9yICYmIHRoaXMubGlzdGVuZXJzKCdlcnJvcicpLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyb3IpO1xuICB9XG5cbiAgZm4oZXJyb3IsIHJlcyk7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgaG9zdCBvYmplY3QsXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBob3N0IG9iamVjdFxuICogQHJldHVybiB7Qm9vbGVhbn0gaXMgYSBob3N0IG9iamVjdFxuICogQGFwaSBwcml2YXRlXG4gKi9cblJlcXVlc3QucHJvdG90eXBlLl9pc0hvc3QgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gIHJldHVybiAoXG4gICAgQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkgfHxcbiAgICBvYmplY3QgaW5zdGFuY2VvZiBTdHJlYW0gfHxcbiAgICBvYmplY3QgaW5zdGFuY2VvZiBGb3JtRGF0YVxuICApO1xufTtcblxuLyoqXG4gKiBJbml0aWF0ZSByZXF1ZXN0LCBpbnZva2luZyBjYWxsYmFjayBgZm4oZXJyLCByZXMpYFxuICogd2l0aCBhbiBpbnN0YW5jZW9mIGBSZXNwb25zZWAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fZW1pdFJlc3BvbnNlID0gZnVuY3Rpb24gKGJvZHksIGZpbGVzKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHRoaXMpO1xuICB0aGlzLnJlc3BvbnNlID0gcmVzcG9uc2U7XG4gIHJlc3BvbnNlLnJlZGlyZWN0cyA9IHRoaXMuX3JlZGlyZWN0TGlzdDtcbiAgaWYgKHVuZGVmaW5lZCAhPT0gYm9keSkge1xuICAgIHJlc3BvbnNlLmJvZHkgPSBib2R5O1xuICB9XG5cbiAgcmVzcG9uc2UuZmlsZXMgPSBmaWxlcztcbiAgaWYgKHRoaXMuX2VuZENhbGxlZCkge1xuICAgIHJlc3BvbnNlLnBpcGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiZW5kKCkgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQsIHNvIGl0J3MgdG9vIGxhdGUgdG8gc3RhcnQgcGlwaW5nXCJcbiAgICAgICk7XG4gICAgfTtcbiAgfVxuXG4gIHRoaXMuZW1pdCgncmVzcG9uc2UnLCByZXNwb25zZSk7XG4gIHJldHVybiByZXNwb25zZTtcbn07XG5cbi8qKlxuICogRW1pdCBgcmVkaXJlY3RgIGV2ZW50LCBwYXNzaW5nIGFuIGluc3RhbmNlb2YgYFJlc3BvbnNlYC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5fZW1pdFJlZGlyZWN0ID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCByZXNwb25zZSA9IG5ldyBSZXNwb25zZSh0aGlzKTtcbiAgcmVzcG9uc2UucmVkaXJlY3RzID0gdGhpcy5fcmVkaXJlY3RMaXN0O1xuICB0aGlzLmVtaXQoJ3JlZGlyZWN0JywgcmVzcG9uc2UpO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKGZuKSB7XG4gIHRoaXMucmVxdWVzdCgpO1xuICBkZWJ1ZygnJXMgJXMnLCB0aGlzLm1ldGhvZCwgdGhpcy51cmwpO1xuXG4gIGlmICh0aGlzLl9lbmRDYWxsZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnLmVuZCgpIHdhcyBjYWxsZWQgdHdpY2UuIFRoaXMgaXMgbm90IHN1cHBvcnRlZCBpbiBzdXBlcmFnZW50J1xuICAgICk7XG4gIH1cblxuICB0aGlzLl9lbmRDYWxsZWQgPSB0cnVlO1xuXG4gIC8vIHN0b3JlIGNhbGxiYWNrXG4gIHRoaXMuX2NhbGxiYWNrID0gZm4gfHwgbm9vcDtcblxuICB0aGlzLl9lbmQoKTtcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLl9lbmQgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl9hYm9ydGVkKVxuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrKFxuICAgICAgbmV3IEVycm9yKCdUaGUgcmVxdWVzdCBoYXMgYmVlbiBhYm9ydGVkIGV2ZW4gYmVmb3JlIC5lbmQoKSB3YXMgY2FsbGVkJylcbiAgICApO1xuXG4gIGxldCBkYXRhID0gdGhpcy5fZGF0YTtcbiAgY29uc3QgeyByZXEgfSA9IHRoaXM7XG4gIGNvbnN0IHsgbWV0aG9kIH0gPSB0aGlzO1xuXG4gIHRoaXMuX3NldFRpbWVvdXRzKCk7XG5cbiAgLy8gYm9keVxuICBpZiAobWV0aG9kICE9PSAnSEVBRCcgJiYgIXJlcS5faGVhZGVyU2VudCkge1xuICAgIC8vIHNlcmlhbGl6ZSBzdHVmZlxuICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGxldCBjb250ZW50VHlwZSA9IHJlcS5nZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScpO1xuICAgICAgLy8gUGFyc2Ugb3V0IGp1c3QgdGhlIGNvbnRlbnQgdHlwZSBmcm9tIHRoZSBoZWFkZXIgKGlnbm9yZSB0aGUgY2hhcnNldClcbiAgICAgIGlmIChjb250ZW50VHlwZSkgY29udGVudFR5cGUgPSBjb250ZW50VHlwZS5zcGxpdCgnOycpWzBdO1xuICAgICAgbGV0IHNlcmlhbGl6ZSA9IHRoaXMuX3NlcmlhbGl6ZXIgfHwgZXhwb3J0cy5zZXJpYWxpemVbY29udGVudFR5cGVdO1xuICAgICAgaWYgKCFzZXJpYWxpemUgJiYgaXNKU09OKGNvbnRlbnRUeXBlKSkge1xuICAgICAgICBzZXJpYWxpemUgPSBleHBvcnRzLnNlcmlhbGl6ZVsnYXBwbGljYXRpb24vanNvbiddO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VyaWFsaXplKSBkYXRhID0gc2VyaWFsaXplKGRhdGEpO1xuICAgIH1cblxuICAgIC8vIGNvbnRlbnQtbGVuZ3RoXG4gICAgaWYgKGRhdGEgJiYgIXJlcS5nZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJykpIHtcbiAgICAgIHJlcS5zZXRIZWFkZXIoXG4gICAgICAgICdDb250ZW50LUxlbmd0aCcsXG4gICAgICAgIEJ1ZmZlci5pc0J1ZmZlcihkYXRhKSA/IGRhdGEubGVuZ3RoIDogQnVmZmVyLmJ5dGVMZW5ndGgoZGF0YSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gcmVzcG9uc2VcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbiAgcmVxLm9uY2UoJ3Jlc3BvbnNlJywgKHJlcykgPT4ge1xuICAgIGRlYnVnKCclcyAlcyAtPiAlcycsIHRoaXMubWV0aG9kLCB0aGlzLnVybCwgcmVzLnN0YXR1c0NvZGUpO1xuXG4gICAgaWYgKHRoaXMuX3Jlc3BvbnNlVGltZW91dFRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVzcG9uc2VUaW1lb3V0VGltZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpcGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWF4ID0gdGhpcy5fbWF4UmVkaXJlY3RzO1xuICAgIGNvbnN0IG1pbWUgPSB1dGlscy50eXBlKHJlcy5oZWFkZXJzWydjb250ZW50LXR5cGUnXSB8fCAnJykgfHwgJ3RleHQvcGxhaW4nO1xuICAgIGxldCB0eXBlID0gbWltZS5zcGxpdCgnLycpWzBdO1xuICAgIGlmICh0eXBlKSB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICBjb25zdCBtdWx0aXBhcnQgPSB0eXBlID09PSAnbXVsdGlwYXJ0JztcbiAgICBjb25zdCByZWRpcmVjdCA9IGlzUmVkaXJlY3QocmVzLnN0YXR1c0NvZGUpO1xuICAgIGNvbnN0IHJlc3BvbnNlVHlwZSA9IHRoaXMuX3Jlc3BvbnNlVHlwZTtcblxuICAgIHRoaXMucmVzID0gcmVzO1xuXG4gICAgLy8gcmVkaXJlY3RcbiAgICBpZiAocmVkaXJlY3QgJiYgdGhpcy5fcmVkaXJlY3RzKysgIT09IG1heCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlZGlyZWN0KHJlcyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWV0aG9kID09PSAnSEVBRCcpIHtcbiAgICAgIHRoaXMuZW1pdCgnZW5kJyk7XG4gICAgICB0aGlzLmNhbGxiYWNrKG51bGwsIHRoaXMuX2VtaXRSZXNwb25zZSgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyB6bGliIHN1cHBvcnRcbiAgICBpZiAodGhpcy5fc2hvdWxkVW56aXAocmVzKSkge1xuICAgICAgdW56aXAocmVxLCByZXMpO1xuICAgIH1cblxuICAgIGxldCBidWZmZXIgPSB0aGlzLl9idWZmZXI7XG4gICAgaWYgKGJ1ZmZlciA9PT0gdW5kZWZpbmVkICYmIG1pbWUgaW4gZXhwb3J0cy5idWZmZXIpIHtcbiAgICAgIGJ1ZmZlciA9IEJvb2xlYW4oZXhwb3J0cy5idWZmZXJbbWltZV0pO1xuICAgIH1cblxuICAgIGxldCBwYXJzZXIgPSB0aGlzLl9wYXJzZXI7XG4gICAgaWYgKHVuZGVmaW5lZCA9PT0gYnVmZmVyICYmIHBhcnNlcikge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIkEgY3VzdG9tIHN1cGVyYWdlbnQgcGFyc2VyIGhhcyBiZWVuIHNldCwgYnV0IGJ1ZmZlcmluZyBzdHJhdGVneSBmb3IgdGhlIHBhcnNlciBoYXNuJ3QgYmVlbiBjb25maWd1cmVkLiBDYWxsIGByZXEuYnVmZmVyKHRydWUgb3IgZmFsc2UpYCBvciBzZXQgYHN1cGVyYWdlbnQuYnVmZmVyW21pbWVdID0gdHJ1ZSBvciBmYWxzZWBcIlxuICAgICAgKTtcbiAgICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFwYXJzZXIpIHtcbiAgICAgIGlmIChyZXNwb25zZVR5cGUpIHtcbiAgICAgICAgcGFyc2VyID0gZXhwb3J0cy5wYXJzZS5pbWFnZTsgLy8gSXQncyBhY3R1YWxseSBhIGdlbmVyaWMgQnVmZmVyXG4gICAgICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKG11bHRpcGFydCkge1xuICAgICAgICBjb25zdCBmb3JtID0gZm9ybWlkYWJsZS5mb3JtaWRhYmxlKCk7XG4gICAgICAgIHBhcnNlciA9IGZvcm0ucGFyc2UuYmluZChmb3JtKTtcbiAgICAgICAgYnVmZmVyID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNCaW5hcnkobWltZSkpIHtcbiAgICAgICAgcGFyc2VyID0gZXhwb3J0cy5wYXJzZS5pbWFnZTtcbiAgICAgICAgYnVmZmVyID0gdHJ1ZTsgLy8gRm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGJ1ZmZlcmluZyBkZWZhdWx0IGlzIGFkLWhvYyBNSU1FLWRlcGVuZGVudFxuICAgICAgfSBlbHNlIGlmIChleHBvcnRzLnBhcnNlW21pbWVdKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2VbbWltZV07XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICBwYXJzZXIgPSBleHBvcnRzLnBhcnNlLnRleHQ7XG4gICAgICAgIGJ1ZmZlciA9IGJ1ZmZlciAhPT0gZmFsc2U7XG4gICAgICAgIC8vIGV2ZXJ5b25lIHdhbnRzIHRoZWlyIG93biB3aGl0ZS1sYWJlbGVkIGpzb25cbiAgICAgIH0gZWxzZSBpZiAoaXNKU09OKG1pbWUpKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2VbJ2FwcGxpY2F0aW9uL2pzb24nXTtcbiAgICAgICAgYnVmZmVyID0gYnVmZmVyICE9PSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoYnVmZmVyKSB7XG4gICAgICAgIHBhcnNlciA9IGV4cG9ydHMucGFyc2UudGV4dDtcbiAgICAgIH0gZWxzZSBpZiAodW5kZWZpbmVkID09PSBidWZmZXIpIHtcbiAgICAgICAgcGFyc2VyID0gZXhwb3J0cy5wYXJzZS5pbWFnZTsgLy8gSXQncyBhY3R1YWxseSBhIGdlbmVyaWMgQnVmZmVyXG4gICAgICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYnkgZGVmYXVsdCBvbmx5IGJ1ZmZlciB0ZXh0LyosIGpzb24gYW5kIG1lc3NlZCB1cCB0aGluZyBmcm9tIGhlbGxcbiAgICBpZiAoKHVuZGVmaW5lZCA9PT0gYnVmZmVyICYmIGlzVGV4dChtaW1lKSkgfHwgaXNKU09OKG1pbWUpKSB7XG4gICAgICBidWZmZXIgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc0J1ZmZlcmVkID0gYnVmZmVyO1xuICAgIGxldCBwYXJzZXJIYW5kbGVzRW5kID0gZmFsc2U7XG4gICAgaWYgKGJ1ZmZlcikge1xuICAgICAgLy8gUHJvdGVjdGlvbmEgYWdhaW5zdCB6aXAgYm9tYnMgYW5kIG90aGVyIG51aXNhbmNlXG4gICAgICBsZXQgcmVzcG9uc2VCeXRlc0xlZnQgPSB0aGlzLl9tYXhSZXNwb25zZVNpemUgfHwgMjAwMDAwMDAwO1xuICAgICAgcmVzLm9uKCdkYXRhJywgKGJ1ZikgPT4ge1xuICAgICAgICByZXNwb25zZUJ5dGVzTGVmdCAtPSBidWYuYnl0ZUxlbmd0aCB8fCBidWYubGVuZ3RoID4gMCA/IGJ1Zi5sZW5ndGggOiAwO1xuICAgICAgICBpZiAocmVzcG9uc2VCeXRlc0xlZnQgPCAwKSB7XG4gICAgICAgICAgLy8gVGhpcyB3aWxsIHByb3BhZ2F0ZSB0aHJvdWdoIGVycm9yIGV2ZW50XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ01heGltdW0gcmVzcG9uc2Ugc2l6ZSByZWFjaGVkJyk7XG4gICAgICAgICAgZXJyb3IuY29kZSA9ICdFVE9PTEFSR0UnO1xuICAgICAgICAgIC8vIFBhcnNlcnMgYXJlbid0IHJlcXVpcmVkIHRvIG9ic2VydmUgZXJyb3IgZXZlbnQsXG4gICAgICAgICAgLy8gc28gd291bGQgaW5jb3JyZWN0bHkgcmVwb3J0IHN1Y2Nlc3NcbiAgICAgICAgICBwYXJzZXJIYW5kbGVzRW5kID0gZmFsc2U7XG4gICAgICAgICAgLy8gV2lsbCBub3QgZW1pdCBlcnJvciBldmVudFxuICAgICAgICAgIHJlcy5kZXN0cm95KGVycm9yKTtcbiAgICAgICAgICAvLyBzbyB3ZSBkbyBjYWxsYmFjayBub3dcbiAgICAgICAgICB0aGlzLmNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVW5idWZmZXJlZCBwYXJzZXJzIGFyZSBzdXBwb3NlZCB0byBlbWl0IHJlc3BvbnNlIGVhcmx5LFxuICAgICAgICAvLyB3aGljaCBpcyB3ZWlyZCBCVFcsIGJlY2F1c2UgcmVzcG9uc2UuYm9keSB3b24ndCBiZSB0aGVyZS5cbiAgICAgICAgcGFyc2VySGFuZGxlc0VuZCA9IGJ1ZmZlcjtcblxuICAgICAgICBwYXJzZXIocmVzLCAoZXJyb3IsIG9iamVjdCwgZmlsZXMpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy50aW1lZG91dCkge1xuICAgICAgICAgICAgLy8gVGltZW91dCBoYXMgYWxyZWFkeSBoYW5kbGVkIGFsbCBjYWxsYmFja3NcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJbnRlbnRpb25hbCAobm9uLXRpbWVvdXQpIGFib3J0IGlzIHN1cHBvc2VkIHRvIHByZXNlcnZlIHBhcnRpYWwgcmVzcG9uc2UsXG4gICAgICAgICAgLy8gZXZlbiBpZiBpdCBkb2Vzbid0IHBhcnNlLlxuICAgICAgICAgIGlmIChlcnJvciAmJiAhdGhpcy5fYWJvcnRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwYXJzZXJIYW5kbGVzRW5kKSB7XG4gICAgICAgICAgICBpZiAobXVsdGlwYXJ0KSB7XG4gICAgICAgICAgICAgIC8vIGZvcm1pZGFibGUgdjMgYWx3YXlzIHJldHVybnMgYW4gYXJyYXkgd2l0aCB0aGUgdmFsdWUgaW4gaXRcbiAgICAgICAgICAgICAgLy8gc28gd2UgbmVlZCB0byBmbGF0dGVuIGl0XG4gICAgICAgICAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gdmFsdWVbMF07XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChmaWxlcykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGZpbGVzW2tleV07XG4gICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzW2tleV0gPSB2YWx1ZVswXTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZW5kJyk7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrKG51bGwsIHRoaXMuX2VtaXRSZXNwb25zZShvYmplY3QsIGZpbGVzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmNhbGxiYWNrKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJlcyA9IHJlcztcblxuICAgIC8vIHVuYnVmZmVyZWRcbiAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgZGVidWcoJ3VuYnVmZmVyZWQgJXMgJXMnLCB0aGlzLm1ldGhvZCwgdGhpcy51cmwpO1xuICAgICAgdGhpcy5jYWxsYmFjayhudWxsLCB0aGlzLl9lbWl0UmVzcG9uc2UoKSk7XG4gICAgICBpZiAobXVsdGlwYXJ0KSByZXR1cm47IC8vIGFsbG93IG11bHRpcGFydCB0byBoYW5kbGUgZW5kIGV2ZW50XG4gICAgICByZXMub25jZSgnZW5kJywgKCkgPT4ge1xuICAgICAgICBkZWJ1ZygnZW5kICVzICVzJywgdGhpcy5tZXRob2QsIHRoaXMudXJsKTtcbiAgICAgICAgdGhpcy5lbWl0KCdlbmQnKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHRlcm1pbmF0aW5nIGV2ZW50c1xuICAgIHJlcy5vbmNlKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgcGFyc2VySGFuZGxlc0VuZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfSk7XG4gICAgaWYgKCFwYXJzZXJIYW5kbGVzRW5kKVxuICAgICAgcmVzLm9uY2UoJ2VuZCcsICgpID0+IHtcbiAgICAgICAgZGVidWcoJ2VuZCAlcyAlcycsIHRoaXMubWV0aG9kLCB0aGlzLnVybCk7XG4gICAgICAgIC8vIFRPRE86IHVubGVzcyBidWZmZXJpbmcgZW1pdCBlYXJsaWVyIHRvIHN0cmVhbVxuICAgICAgICB0aGlzLmVtaXQoJ2VuZCcpO1xuICAgICAgICB0aGlzLmNhbGxiYWNrKG51bGwsIHRoaXMuX2VtaXRSZXNwb25zZSgpKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICB0aGlzLmVtaXQoJ3JlcXVlc3QnLCB0aGlzKTtcblxuICBjb25zdCBnZXRQcm9ncmVzc01vbml0b3IgPSAoKSA9PiB7XG4gICAgY29uc3QgbGVuZ3RoQ29tcHV0YWJsZSA9IHRydWU7XG4gICAgY29uc3QgdG90YWwgPSByZXEuZ2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcpO1xuICAgIGxldCBsb2FkZWQgPSAwO1xuXG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBuZXcgU3RyZWFtLlRyYW5zZm9ybSgpO1xuICAgIHByb2dyZXNzLl90cmFuc2Zvcm0gPSAoY2h1bmssIGVuY29kaW5nLCBjYWxsYmFjaykgPT4ge1xuICAgICAgbG9hZGVkICs9IGNodW5rLmxlbmd0aDtcbiAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCB7XG4gICAgICAgIGRpcmVjdGlvbjogJ3VwbG9hZCcsXG4gICAgICAgIGxlbmd0aENvbXB1dGFibGUsXG4gICAgICAgIGxvYWRlZCxcbiAgICAgICAgdG90YWxcbiAgICAgIH0pO1xuICAgICAgY2FsbGJhY2sobnVsbCwgY2h1bmspO1xuICAgIH07XG5cbiAgICByZXR1cm4gcHJvZ3Jlc3M7XG4gIH07XG5cbiAgY29uc3QgYnVmZmVyVG9DaHVua3MgPSAoYnVmZmVyKSA9PiB7XG4gICAgY29uc3QgY2h1bmtTaXplID0gMTYgKiAxMDI0OyAvLyBkZWZhdWx0IGhpZ2hXYXRlck1hcmsgdmFsdWVcbiAgICBjb25zdCBjaHVua2luZyA9IG5ldyBTdHJlYW0uUmVhZGFibGUoKTtcbiAgICBjb25zdCB0b3RhbExlbmd0aCA9IGJ1ZmZlci5sZW5ndGg7XG4gICAgY29uc3QgcmVtYWluZGVyID0gdG90YWxMZW5ndGggJSBjaHVua1NpemU7XG4gICAgY29uc3QgY3V0b2ZmID0gdG90YWxMZW5ndGggLSByZW1haW5kZXI7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1dG9mZjsgaSArPSBjaHVua1NpemUpIHtcbiAgICAgIGNvbnN0IGNodW5rID0gYnVmZmVyLnNsaWNlKGksIGkgKyBjaHVua1NpemUpO1xuICAgICAgY2h1bmtpbmcucHVzaChjaHVuayk7XG4gICAgfVxuXG4gICAgaWYgKHJlbWFpbmRlciA+IDApIHtcbiAgICAgIGNvbnN0IHJlbWFpbmRlckJ1ZmZlciA9IGJ1ZmZlci5zbGljZSgtcmVtYWluZGVyKTtcbiAgICAgIGNodW5raW5nLnB1c2gocmVtYWluZGVyQnVmZmVyKTtcbiAgICB9XG5cbiAgICBjaHVua2luZy5wdXNoKG51bGwpOyAvLyBubyBtb3JlIGRhdGFcblxuICAgIHJldHVybiBjaHVua2luZztcbiAgfTtcblxuICAvLyBpZiBhIEZvcm1EYXRhIGluc3RhbmNlIGdvdCBjcmVhdGVkLCB0aGVuIHdlIHNlbmQgdGhhdCBhcyB0aGUgcmVxdWVzdCBib2R5XG4gIGNvbnN0IGZvcm1EYXRhID0gdGhpcy5fZm9ybURhdGE7XG4gIGlmIChmb3JtRGF0YSkge1xuICAgIC8vIHNldCBoZWFkZXJzXG4gICAgY29uc3QgaGVhZGVycyA9IGZvcm1EYXRhLmdldEhlYWRlcnMoKTtcbiAgICBmb3IgKGNvbnN0IGkgaW4gaGVhZGVycykge1xuICAgICAgaWYgKGhhc093bihoZWFkZXJzLCBpKSkge1xuICAgICAgICBkZWJ1Zygnc2V0dGluZyBGb3JtRGF0YSBoZWFkZXI6IFwiJXM6ICVzXCInLCBpLCBoZWFkZXJzW2ldKTtcbiAgICAgICAgcmVxLnNldEhlYWRlcihpLCBoZWFkZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhdHRlbXB0IHRvIGdldCBcIkNvbnRlbnQtTGVuZ3RoXCIgaGVhZGVyXG4gICAgZm9ybURhdGEuZ2V0TGVuZ3RoKChlcnJvciwgbGVuZ3RoKSA9PiB7XG4gICAgICAvLyBUT0RPOiBBZGQgY2h1bmtlZCBlbmNvZGluZyB3aGVuIG5vIGxlbmd0aCAoaWYgZXJyKVxuICAgICAgaWYgKGVycm9yKSBkZWJ1ZygnZm9ybURhdGEuZ2V0TGVuZ3RoIGhhZCBlcnJvcicsIGVycm9yLCBsZW5ndGgpO1xuXG4gICAgICBkZWJ1ZygnZ290IEZvcm1EYXRhIENvbnRlbnQtTGVuZ3RoOiAlcycsIGxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmVxLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBsZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBmb3JtRGF0YS5waXBlKGdldFByb2dyZXNzTW9uaXRvcigpKS5waXBlKHJlcSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSB7XG4gICAgYnVmZmVyVG9DaHVua3MoZGF0YSkucGlwZShnZXRQcm9ncmVzc01vbml0b3IoKSkucGlwZShyZXEpO1xuICB9IGVsc2Uge1xuICAgIHJlcS5lbmQoZGF0YSk7XG4gIH1cbn07XG5cbi8vIENoZWNrIHdoZXRoZXIgcmVzcG9uc2UgaGFzIGEgbm9uLTAtc2l6ZWQgZ3ppcC1lbmNvZGVkIGJvZHlcblJlcXVlc3QucHJvdG90eXBlLl9zaG91bGRVbnppcCA9IChyZXMpID0+IHtcbiAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDQgfHwgcmVzLnN0YXR1c0NvZGUgPT09IDMwNCkge1xuICAgIC8vIFRoZXNlIGFyZW4ndCBzdXBwb3NlZCB0byBoYXZlIGFueSBib2R5XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaGVhZGVyIGNvbnRlbnQgaXMgYSBzdHJpbmcsIGFuZCBkaXN0aW5jdGlvbiBiZXR3ZWVuIDAgYW5kIG5vIGluZm9ybWF0aW9uIGlzIGNydWNpYWxcbiAgaWYgKHJlcy5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddID09PSAnMCcpIHtcbiAgICAvLyBXZSBrbm93IHRoYXQgdGhlIGJvZHkgaXMgZW1wdHkgKHVuZm9ydHVuYXRlbHksIHRoaXMgY2hlY2sgZG9lcyBub3QgY292ZXIgY2h1bmtlZCBlbmNvZGluZylcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBjb25zb2xlLmxvZyhyZXMpO1xuICByZXR1cm4gL15cXHMqKD86ZGVmbGF0ZXxnemlwKVxccyokLy50ZXN0KHJlcy5oZWFkZXJzWydjb250ZW50LWVuY29kaW5nJ10pO1xufTtcblxuLyoqXG4gKiBPdmVycmlkZXMgRE5TIGZvciBzZWxlY3RlZCBob3N0bmFtZXMuIFRha2VzIG9iamVjdCBtYXBwaW5nIGhvc3RuYW1lcyB0byBJUCBhZGRyZXNzZXMuXG4gKlxuICogV2hlbiBtYWtpbmcgYSByZXF1ZXN0IHRvIGEgVVJMIHdpdGggYSBob3N0bmFtZSBleGFjdGx5IG1hdGNoaW5nIGEga2V5IGluIHRoZSBvYmplY3QsXG4gKiB1c2UgdGhlIGdpdmVuIElQIGFkZHJlc3MgdG8gY29ubmVjdCwgaW5zdGVhZCBvZiB1c2luZyBETlMgdG8gcmVzb2x2ZSB0aGUgaG9zdG5hbWUuXG4gKlxuICogQSBzcGVjaWFsIGhvc3QgYCpgIG1hdGNoZXMgZXZlcnkgaG9zdG5hbWUgKGtlZXAgcmVkaXJlY3RzIGluIG1pbmQhKVxuICpcbiAqICAgICAgcmVxdWVzdC5jb25uZWN0KHtcbiAqICAgICAgICAndGVzdC5leGFtcGxlLmNvbSc6ICcxMjcuMC4wLjEnLFxuICogICAgICAgICdpcHY2LmV4YW1wbGUuY29tJzogJzo6MScsXG4gKiAgICAgIH0pXG4gKi9cblJlcXVlc3QucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoY29ubmVjdE92ZXJyaWRlKSB7XG4gIGlmICh0eXBlb2YgY29ubmVjdE92ZXJyaWRlID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuX2Nvbm5lY3RPdmVycmlkZSA9IHsgJyonOiBjb25uZWN0T3ZlcnJpZGUgfTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgY29ubmVjdE92ZXJyaWRlID09PSAnb2JqZWN0Jykge1xuICAgIHRoaXMuX2Nvbm5lY3RPdmVycmlkZSA9IGNvbm5lY3RPdmVycmlkZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9jb25uZWN0T3ZlcnJpZGUgPSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblJlcXVlc3QucHJvdG90eXBlLnRydXN0TG9jYWxob3N0ID0gZnVuY3Rpb24gKHRvZ2dsZSkge1xuICB0aGlzLl90cnVzdExvY2FsaG9zdCA9IHRvZ2dsZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHRvZ2dsZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBnZW5lcmF0ZSBIVFRQIHZlcmIgbWV0aG9kc1xuaWYgKCFtZXRob2RzLmluY2x1ZGVzKCdkZWwnKSkge1xuICAvLyBjcmVhdGUgYSBjb3B5IHNvIHdlIGRvbid0IGNhdXNlIGNvbmZsaWN0cyB3aXRoXG4gIC8vIG90aGVyIHBhY2thZ2VzIHVzaW5nIHRoZSBtZXRob2RzIHBhY2thZ2UgYW5kXG4gIC8vIG5wbSAzLnhcbiAgbWV0aG9kcyA9IFsuLi5tZXRob2RzXTtcbiAgbWV0aG9kcy5wdXNoKCdkZWwnKTtcbn1cblxuZm9yIChsZXQgbWV0aG9kIG9mIG1ldGhvZHMpIHtcbiAgY29uc3QgbmFtZSA9IG1ldGhvZDtcbiAgbWV0aG9kID0gbWV0aG9kID09PSAnZGVsJyA/ICdkZWxldGUnIDogbWV0aG9kO1xuXG4gIG1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICByZXF1ZXN0W25hbWVdID0gKHVybCwgZGF0YSwgZm4pID0+IHtcbiAgICBjb25zdCByZXF1ZXN0XyA9IHJlcXVlc3QobWV0aG9kLCB1cmwpO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZm4gPSBkYXRhO1xuICAgICAgZGF0YSA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIGlmIChtZXRob2QgPT09ICdHRVQnIHx8IG1ldGhvZCA9PT0gJ0hFQUQnKSB7XG4gICAgICAgIHJlcXVlc3RfLnF1ZXJ5KGRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdF8uc2VuZChkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZm4pIHJlcXVlc3RfLmVuZChmbik7XG4gICAgcmV0dXJuIHJlcXVlc3RfO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBtaW1lYCBpcyB0ZXh0IGFuZCBzaG91bGQgYmUgYnVmZmVyZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGlzVGV4dChtaW1lKSB7XG4gIGNvbnN0IHBhcnRzID0gbWltZS5zcGxpdCgnLycpO1xuICBsZXQgdHlwZSA9IHBhcnRzWzBdO1xuICBpZiAodHlwZSkgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIGxldCBzdWJ0eXBlID0gcGFydHNbMV07XG4gIGlmIChzdWJ0eXBlKSBzdWJ0eXBlID0gc3VidHlwZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICByZXR1cm4gdHlwZSA9PT0gJ3RleHQnIHx8IHN1YnR5cGUgPT09ICd4LXd3dy1mb3JtLXVybGVuY29kZWQnO1xufVxuXG4vLyBUaGlzIGlzIG5vdCBhIGNhdGNoYWxsLCBidXQgYSBzdGFydC4gSXQgbWlnaHQgYmUgdXNlZnVsXG4vLyBpbiB0aGUgbG9uZyBydW4gdG8gaGF2ZSBmaWxlIHRoYXQgaW5jbHVkZXMgYWxsIGJpbmFyeVxuLy8gY29udGVudCB0eXBlcyBmcm9tIGh0dHBzOi8vd3d3LmlhbmEub3JnL2Fzc2lnbm1lbnRzL21lZGlhLXR5cGVzL21lZGlhLXR5cGVzLnhodG1sXG5mdW5jdGlvbiBpc0JpbmFyeShtaW1lKSB7XG4gIGxldCBbcmVnaXN0cnksIG5hbWVdID0gbWltZS5zcGxpdCgnLycpO1xuICBpZiAocmVnaXN0cnkpIHJlZ2lzdHJ5ID0gcmVnaXN0cnkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gIGlmIChuYW1lKSBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgcmV0dXJuIChcbiAgICBbJ2F1ZGlvJywgJ2ZvbnQnLCAnaW1hZ2UnLCAndmlkZW8nXS5pbmNsdWRlcyhyZWdpc3RyeSkgfHxcbiAgICBbJ2d6JywgJ2d6aXAnXS5pbmNsdWRlcyhuYW1lKVxuICApO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBtaW1lYCBpcyBqc29uIG9yIGhhcyAranNvbiBzdHJ1Y3R1cmVkIHN5bnRheCBzdWZmaXguXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1pbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc0pTT04obWltZSkge1xuICAvLyBzaG91bGQgbWF0Y2ggL2pzb24gb3IgK2pzb25cbiAgLy8gYnV0IG5vdCAvanNvbi1zZXFcbiAgcmV0dXJuIC9bLytdanNvbigkfFteLVxcd10pL2kudGVzdChtaW1lKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB3ZSBzaG91bGQgZm9sbG93IHRoZSByZWRpcmVjdCBgY29kZWAuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBpc1JlZGlyZWN0KGNvZGUpIHtcbiAgcmV0dXJuIFszMDEsIDMwMiwgMzAzLCAzMDUsIDMwNywgMzA4XS5pbmNsdWRlcyhjb2RlKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7O0FBRUEsTUFB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