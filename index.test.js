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

    });

    describe('middleware.run()', function() {

        var middleware = require('.');

        it('succeeds without middleware', function(done) {
            var app = middleware();
            app.run(done);
        });

        it('succeeds without middleware, with args', function(done) {
            var app = middleware();
            app.run({}, {}, done);
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

    });

    describe('middleware.use()', function() {

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

        it('guarded handlers: executes correct guard', function(done) {

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

        it('guarded handlers: skips incorrect guard', function(done) {

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
