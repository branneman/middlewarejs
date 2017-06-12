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
    return new MiddlewareJS();
}

/**
 * Class MiddlewareJS
 * @constructor
 */
function MiddlewareJS() {
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
    var errHandler = this._errorHandler.bind(this);
    (function call() {

        if (!mws.length) {
            return done.apply({}, args);
        }

        var mw = mws.shift();

        try {
            mw.apply(mw, args.concat(call));
        } catch (err) {
            errHandler.apply({}, args.concat(err));
        }

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
    this._middlewares.unshift(handler);

};

/**
 * @param {function} handler
 */
MiddlewareJS.prototype.err = function err(handler) {

    // Guard
    if (typeof handler !== 'function') {
        throw new Error('Errorhandler must be a function!');
    }

    this._errorHandler = handler;

};

/**
 * Default error handler
 *  Throws the last argument it receives
 * @private
 */
MiddlewareJS.prototype._errorHandler = function _errorHandler() {
    var args = [].slice.call(arguments);
    throw args.pop();
};
