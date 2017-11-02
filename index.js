'use strict';

/* global Promise */
/* eslint-disable consistent-return */

/**
 * Exports
 */
module.exports = factory;
module.exports.MiddlewareJS = MiddlewareJS;

/**
 * Force empty `this` value and prevent usage within done(), handlers and filters
 * @type {Object} - An immutable empty object with `null` as it's prototype
 */
var emptyContext = Object.freeze(Object.create(null));

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

    // Autobind
    this.run = MiddlewareJS.prototype.run.bind(this);
    this.use = MiddlewareJS.prototype.use.bind(this);

}

/**
 * @returns {Promise}
 */
MiddlewareJS.prototype.run = function run() {

    // Convert arguments to array
    var args = [].slice.call(arguments);

    // Clone middlewares array
    var mws = this._middlewares.slice();

    return new Promise(function promiseExecutor(resolve) {

        // Call all middlewares in a recursive loop
        (function next() {

            if (!mws.length) {
                return resolve();
            }

            return mws.shift().apply(emptyContext, args.concat(next));

        }());

    });

};

/**
 * @param {function} filterFn
 * @param {function} handlerFn
 */
MiddlewareJS.prototype.use = function use(filterFn, handlerFn) {

    // First argument is optional
    if (arguments.length === 1) {
        handlerFn = filterFn;
    }

    // Guard
    if (typeof handlerFn !== 'function') {
        throw new Error('Handler must be a function!');
    }
    if (typeof filterFn !== 'function') {
        throw new Error('Filter must be a function!');
    }

    // Apply filter if specified
    var fn = handlerFn;
    if (arguments.length !== 1) {
        fn = _filter(filterFn, handlerFn);
    }

    // Push to middlewares array
    this._middlewares.push(fn);

};

/**
 * @param {function(): boolean} filterFn
 * @param {function} handlerFn
 * @returns {function}
 * @private
 */
function _filter(filterFn, handlerFn) {
    return function _use() {
        var args = [].slice.call(arguments, 0, -1);
        var next = arguments[arguments.length - 1];
        if (filterFn.apply(emptyContext, args)) {
            return handlerFn.apply(emptyContext, arguments);
        }
        return next();
    };
}
