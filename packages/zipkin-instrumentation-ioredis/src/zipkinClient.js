const {Annotation, InetAddress} = require('zipkin');
const redisCommands = require('redis-commands');
module.exports = function zipkinClient(
  tracer,
  redis,
  options,
  serviceName = 'unknown',
  remoteServiceName = 'redis'
) {
  const sa = {
    serviceName: remoteServiceName,
    host: new InetAddress(options.host),
    port: options.port
  };
  function mkZipkinCallback(callback, id) {
    return function zipkinCallback(...args) {
      tracer.scoped(() => {
        tracer.setId(id);
        tracer.recordAnnotation(new Annotation.ClientRecv());
        if (callback) {
          callback.apply(this, args);
        }
      });
    };
  }
  function commonAnnotations(rpc) {
    tracer.recordRpc(rpc);
    tracer.recordAnnotation(new Annotation.ServiceName(serviceName));
    tracer.recordAnnotation(new Annotation.ServerAddr(sa));
    tracer.recordAnnotation(new Annotation.ClientSend());
  }


  const redisClient = redis.createClient(options);
  const methodsToWrap = redisCommands.list;
  const restrictedCommands = [
    'ping',
    'flushall',
    'flushdb',
    'select',
    'auth',
    'info',
    'quit',
    'slaveof',
    'config',
    'sentinel'];
  methodsToWrap.forEach((method) => {
    if (restrictedCommands.indexOf(method) > -1) {
      return;
    }
    const actualFn = redisClient[method];
    redisClient[method] = function(...args) {
      let callback;
      if (typeof(args[args.length - 1]) === 'function') {
        callback = args.pop();
      }

      let id;
      tracer.scoped(() => {
        id = tracer.createChildId();
        tracer.setId(id);
        commonAnnotations(method);
      });
      const wrapper = mkZipkinCallback(callback, id);
      const newArgs = [...args, wrapper];
      return actualFn.apply(this, newArgs);
    };
  });

  return redisClient;
};
