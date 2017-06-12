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

});
