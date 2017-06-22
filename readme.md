# MiddlewareJS

Ultra minimalistic middleware pattern implementation. No dependencies. Unit-tested.

Works on Node.js ≥ 0.12, if you need support for older versions, you'll need to provide a global `Promise` object through a polyfill.

```
npm i middlewarejs --save
```

## Example: Express-style HTTP Server
```js
const http = require('http');
const middleware = require('middlewarejs');
const get = url => req => req.url === url;

const app = middleware();

app.use(get('/'), (req, res) => {
    res.end('<h1>Homepage</h1>');
});

app.use(get('/article'), (req, res) => {
    res.end('<h1>Article</h1>');
});

app.use((req, res) => {
    res.end('<h1>404</h1>');
});

http.createServer()
    .on('request', app.run)
    .listen(8080);
```

## Example: Async parsing queue (first-in first-out)
```js
const middleware = require('middlewarejs');

const q = middleware();

q.use((obj, next) => {
    obj.rows = obj.csv.split('\n');
    next();
});

q.use((obj, next) => {
    obj.cells = obj.rows.map(row => row.split(';'));
    next();
});

const csv = { csv: 'H1;H2;H3\nR1C1;R1C2;R1C3\nR2C1;R2C2;R2C3' };
q.run(csv)
.then(() => console.log('Final value:', csv));
```
