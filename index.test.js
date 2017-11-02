'use strict';

describe('MiddlewareJS', function() {

    var isEmptyObject = function(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === undefined;
    };

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

        it('factory function must not be called with `new`', function() {

            var middleware = require('.');

            expect(function() {
                middleware();
            }).not.toThrow();

            expect(function() {
                new middleware();
            }).toThrow();

        });

    });

    describe('MiddlewareJS()', function() {

        var middleware = require('.');

        it('constructor must be called with `new`', function() {

            var MiddlewareJS = middleware.MiddlewareJS;

            expect(function() {
                MiddlewareJS();
            }).toThrow();

            expect(function() {
                new MiddlewareJS();
            }).not.toThrow();

        });

        it('constructor autobinds run() and use()', function(done) {

            var fn1 = jest.fn(function(next) { next(); });

            var app = middleware();

            var use = app.use;
            var run = app.run;

            expect(function() {
                use(fn1);
            }).not.toThrow();

            expect(function() {
                run().then(done);
            }).not.toThrow();

        });

    });

    describe('run()', function() {

        var middleware = require('.');

        it('returns a promise', function() {

            var fn1 = jest.fn();

            var app = middleware();
            app.use(fn1);
            var result = app.run();

            expect(result.constructor).toBe(Promise);
            expect(result instanceof Promise).toBe(true);

        });

        it('rejects a promise on throwing middleware', function() {

            var err = new Error('Test');
            var fn1 = function() { throw err; };

            var app = middleware();
            app.use(fn1);

            return expect(app.run()).rejects.toBe(err);

        });

        it('succeeds without middleware', function(done) {

            var app = middleware();

            app.run().then(done);

        });

        it('succeeds without middleware, with args', function(done) {

            var app = middleware();

            app.run({}, {}).then(done);

        });

        it('succeeds running multiple times', function(done) {

            var app = middleware();
            var p1 = app.run({});
            var p2 = app.run({}, {});
            var p3 = app.run({}, 13, 37, {});

            Promise.all([p1, p2, p3]).then(done);

        });

    });

    describe('use()', function() {

        var middleware = require('.');

        it('throws when given non function types', function() {

            var app = middleware();

            expect(function() {
                app.use();
            }).toThrow();

            expect(function() {
                app.use(1);
            }).toThrow();

            expect(function() {
                app.use('not a function');
            }).toThrow();

            expect(function() {
                app.use({}, function() {});
            }).toThrow();

            expect(function() {
                app.use(function() {}, []);
            }).toThrow();

        });

        it('iterates through basic middleware', function(done) {

            var fn1 = jest.fn(function(a1, a2, next) { next(); });
            var fn2 = jest.fn(function(a1, a2, next) { next(); });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({}, {}).then(cb);

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
            app.run().then(cb);

            expect(fn1).toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
            expect(cb).not.toHaveBeenCalled();

        });

        it('handles async handlers', function(done) {

            var fn1 = jest.fn(function(a1, a2, next) {
                setTimeout(next, 500);
            });
            var fn2 = jest.fn(function(a1, a2, next) {
                setTimeout(next, 750);
            });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({}, {}).then(cb);

            function cb() {
                expect(fn1).toHaveBeenCalled();
                expect(fn2).toHaveBeenCalled();
                done();
            }

        });

        it('calls handler functions without a context', function(done) {

            var context;
            var fn = function(next) {
                context = this;
                next();
            };

            var app = middleware();
            app.use(fn);
            app.run().then(cb);

            function cb() {
                expect(isEmptyObject(context)).toBe(true);
                done();
            }

        });

        it('handler function is given all arguments and next()', function(done) {

            var arg1 = { url: '/aap' };
            var arg2 = 1337;
            var arg3 = true;
            var fn = jest.fn(function(a1, a2, a3, next) { next(); });

            var app = middleware();
            app.use(fn);
            app.run(arg1, arg2, arg3).then(cb);

            function cb() {
                expect(fn).toHaveBeenCalled();
                expect(fn.mock.calls[0][0]).toBe(arg1);
                expect(fn.mock.calls[0][1]).toBe(arg2);
                expect(fn.mock.calls[0][2]).toBe(arg3);
                expect(typeof fn.mock.calls[0][3]).toBe('function');
                done();
            }

        });

    });

    describe('use() with filter', function() {

        var middleware = require('.');

        var filter = function(prefix, fn) {
            return function(req, res, next) {
                if (req.url === prefix) {
                    fn(req, res, next);
                } else {
                    next();
                }
            };
        };

        it('executes matching filter', function(done) {

            var filterFn = function(req, res) {
                return req.url === '/yes';
            };
            var fn1 = jest.fn(function(a1, a2, next) { next(); });
            var fn2 = jest.fn(function(a1, a2, next) { next(); });

            var app = middleware();
            app.use(fn1);
            app.use(filterFn, fn2);
            app.run({ url: '/yes' }, {}).then(cb);

            function cb() {
                expect(fn1).toHaveBeenCalled();
                expect(fn2).toHaveBeenCalled();
                done();
            }

        });

        it('skips not matching filter', function(done) {

            var filterFn1 = function(obj) {
                return obj.url === '/yes';
            };
            var filterFn2 = function(obj) {
                return obj.url === '/no';
            };
            var fn1 = jest.fn(function(a1, next) { next(); });
            var fn2 = jest.fn(function(a1, next) { next(); });

            var app = middleware();
            app.use(filterFn1, fn1);
            app.use(filterFn2, fn2);
            app.run({ url: '/yes' }).then(cb);

            function cb() {
                expect(fn1).toHaveBeenCalled();
                expect(fn2).not.toHaveBeenCalled();
                done();
            }

        });

        it('custom filter function: executes matching filter', function(done) {

            var fn1Called = false;
            var fn2Called = false;
            var fn1 = function(a1, a2, next) {
                fn1Called = true;
                next();
            };
            var fn2 = filter('/prefix', function(a1, a2, next) {
                fn2Called = true;
                next();
            });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({ url: '/prefix' }, {}).then(cb);

            function cb() {
                expect(fn1Called).toBe(true);
                expect(fn2Called).toBe(true);
                done();
            }

        });

        it('custom filter function: skips not matching filter', function(done) {

            var fn1Called = false;
            var fn2Called = false;
            var fn1 = filter('/yes', function(a1, a2, next) {
                fn1Called = true;
                next();
            });
            var fn2 = filter('/no', function(a1, a2, next) {
                fn2Called = true;
                next();
            });

            var app = middleware();
            app.use(fn1);
            app.use(fn2);
            app.run({ url: '/yes' }, {}).then(cb);

            function cb() {
                expect(fn1Called).toBe(true);
                expect(fn2Called).toBe(false);
                done();
            }

        });

        it('calls filter functions without a context', function(done) {

            var context;
            var filterFn = function(obj) {
                context = this;
                return obj.url === '/yes';
            };
            var fn = function(a1, next) { next(); };

            var app = middleware();
            app.use(filterFn, fn);
            app.run({ url: '/yes' }).then(cb);

            function cb() {
                expect(isEmptyObject(context)).toBe(true);
                done();
            }

        });

        it('filter function is given all arguments but next()', function(done) {

            var arg1 = { url: '/yes' };
            var arg2 = [ 1337 ];
            var filterFn = jest.fn().mockReturnValue(true);
            var fn = function(a1, a2, next) { next(); };

            var app = middleware();
            app.use(filterFn, fn);
            app.run(arg1, arg2).then(cb);

            function cb() {
                expect(filterFn).toHaveBeenCalled();
                expect(filterFn.mock.calls[0][0]).toBe(arg1);
                expect(filterFn.mock.calls[0][1]).toBe(arg2);
                expect(filterFn.mock.calls[0][2]).toBe(undefined);
                done();
            }

        });

    });

});
