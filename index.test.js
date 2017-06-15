'use strict';

describe('MiddlewareJS', function() {

    describe('exports', function() {

        it('can be required', function() {

            var path = require('path');
            delete require.cache[path.resolve('./index.js')];

            var middleware = require('./index.js');

            expect(middleware).toBeDefined();
        });

        it('exposes the factory function', function() {
            var middleware = require('.');
            expect(typeof middleware).toBe('function');
        });

        it('exposes a class constructor', function() {
            var middleware = require('.');
            expect(typeof middleware.MiddlewareJS).toBe('function');
        });

        xit('class constructor must be called with `new`', function() {});

    });

    describe('run() / use()', function() {

        var middleware = require('.');

        it('succeeds without middleware', function(done) {
            var app = middleware();
            app.run(done);
        });

        it('succeeds without middleware, with args', function(done) {
            var app = middleware();
            app.run({}, {}, done);
        });

        xit('succeeds without a callback', function() {});

        it('use() throws when given an incorrect type', function() {

            var fn = 'not a function';

            var app = middleware();

            expect(function() {
                app.use(fn);
            }).toThrow();

        });

        it('succeeds running multiple times', function() {

            var fn1 = jest.fn();
            var fn2 = jest.fn();
            var fn3 = jest.fn();

            var app = middleware();
            app.run({}, fn1);
            app.run({}, {}, fn2);
            app.run({}, 13, 37, {}, fn3);

            expect(fn1).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();
            expect(fn3).toHaveBeenCalled();
        });

        it('iterates through basic middleware', function(done) {

            var fn1 = jest.fn(function(a1, a2, next) { next(); });
            var fn2 = jest.fn(function(a1, a2, next) { next(); });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({}, {}, cb);

            function cb() {
                expect(fn1).toHaveBeenCalled();
                expect(fn2).toHaveBeenCalled();
                done();
            }
        });

        it('halts execution when next() is not called', function() {

            var fn1 = jest.fn();
            var fn2 = jest.fn(function(next) { next(); });
            var cb = jest.fn();

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run(cb);

            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            expect(cb).not.toHaveBeenCalled();

        });

        xit('handles async handlers', function() {});

    });

    describe('err()', function() {

        var middleware = require('.');

        it('err() throws when given an incorrect type', function() {

            var fn = 'not a function';

            var app = middleware();

            expect(function() {
                app.err(fn);
            }).toThrow();

        });

        xit('throws with the default error handler', function() {

            var fn1 = function() { /*throw new Error('E!');*/ };
            var fn2 = jest.fn(function(next) { next(); });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);

            expect(app.run).toThrow();
            expect(fn2).not.toHaveBeenCalled();

        });

        xit('calls a specified error handler', function() {});

    });

    describe('guarded handlers', function() {

        var middleware = require('.');

        var guard = function(prefix, fn) {
            return function(req, res, next) {
                if (req.url === prefix) {
                    fn(req, res, next);
                } else {
                    next();
                }
            };
        };

        it('executes correct guard', function(done) {

            var fn1Called = false;
            var fn2Called = false;
            var fn1 = function(a1, a2, next) {
                fn1Called = true;
                next();
            };
            var fn2 = guard('/prefix', function(a1, a2, next) {
                fn2Called = true;
                next();
            });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({ url: '/prefix' }, {}, cb);

            function cb() {
                expect(fn1Called).toBe(true);
                expect(fn2Called).toBe(true);
                done();
            }
        });

        it('skips incorrect guard', function(done) {

            var fn1Called = false;
            var fn2Called = false;
            var fn1 = guard('/yes', function(a1, a2, next) {
                fn1Called = true;
                next();
            });
            var fn2 = guard('/no', function(a1, a2, next) {
                fn2Called = true;
                next();
            });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({ url: '/yes' }, {}, cb);

            function cb() {
                expect(fn1Called).toBe(true);
                expect(fn2Called).toBe(false);
                done();
            }
        });

    });

});
