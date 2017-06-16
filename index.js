'use strict';

/* eslint-disable consistent-return */

/**
 * Exports
 */
module.exports = factory;
module.exports.MiddlewareJS = MiddlewareJS;

/**
 * Factory function
 * @returns {MiddlewareJS}
 */
function factory() {
    if (this instanceof factory) { // eslint-disable-line no-invalid-this
        throw new Error('middleware factory function must not be called with `new`!');
    }
    return new MiddlewareJS();
}

/**
 * Class MiddlewareJS
 * @constructor
 */
function MiddlewareJS() {
    if (!(this instanceof MiddlewareJS)) {
        throw new Error('MiddlewareJS constructor must be called with `new`!');
    }
    this._middlewares = [];
}

/**
 */
MiddlewareJS.prototype.run = function run() {

    // Grab arguments and `done` function, given last
    var args = [].slice.call(arguments);
    var done = args.pop();

    // Clone middlewares array
    var mws = this._middlewares.slice();

    // Call all middlewares in a recursive loop
    (function next() {

        if (!mws.length) {
            return done.apply({}, args);
        }

        var mw = mws.shift();

        mw.apply(mw, args.concat(next));

    }());

};

/**
 * @param {function} handler
 */
MiddlewareJS.prototype.use = function use(handler) {

    // Guard
    if (typeof handler !== 'function') {
        throw new Error('Handler must be a function!');
    }

    // Prepend to middlewares array
    this._middlewares.push(handler);

};
