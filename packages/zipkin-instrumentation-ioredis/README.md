# zipkin-instrumentation-ioredis

This library will wrap the [ioredis client](https://www.npmjs.com/package/ioredis).
This code is almost identical to the zipking-intstrumentation-redis, but handles ioredis Promise defaults.

## Usage

```javascript
const {Tracer} = require('zipkin');
const Redis = require('ioredis');
const zipkinClient = require('zipkin-instrumentation-ioredis');
const tracer = new Tracer({ctxImpl, recorder}); // configure your tracer properly here
const redisConnectionOptions = {
  host: 'localhost',
  port: '6379'
};
const redis = zipkinClient(tracer, Redis, redisConnectionOptions);

// Your application code here

//callback based
redis.get('foo', (err, data) => {
  console.log('got', data.foo);
});

//promise based
redis.get('foo')
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  }
});

```
