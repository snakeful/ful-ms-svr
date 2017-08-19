# Ful Microservice Server
A microservice server make microserivces with [Ful Proxy Server](https://github.com/snakeful/ful-pxy-svr/blob/master/README.md) discovery functionality nad proxy load balance.

# npm
To install it in your proyect
```npm
npm install ful-ms-svr --save
```

# Features
* Microservice server structure to implement functionality from start.
* Server side discovery registration with [Ful Proxy Server](https://github.com/snakeful/ful-pxy-svr/blob/master/README.md)

# Quick start
```
const { server, registerServer, unregisterServer } = require('ful-ms-svr');
let port = 3000;
console.log(`Running from testing. ${process.pid}`);
server.port = port;
server.registerServer = registerServer;
server.unregisterServer = unregisterServer;
server.discoveryHost = '127.0.0.1';
server.discoveryPort = 81;
server.run(port);
```

# Quick start clustered environment
```
const cluster = require('cluster');
const processors = require('os').cpus();
let port = 3000;
if (cluster.isMaster) {
  const { server, registerServer, unregisterServer } = require('ful-ms-svr');
  server.port = port;
  server.discoveryHost = '127.0.0.1';
  server.discoveryPort = 81;
  server.unregisterServer = unregisterServer;
  registerServer().then(msg => {
    console.log(msg);
  }).catch(err => {
    console.log(`Error registering server. Code ${err.code} Call ${err.syscall} Address ${err.address} Port ${err.port}`);
  });;
  // Clustering servers
  cluster.schedulingPolicy = cluster.SCHED_RR;
  for (let processorId = 0; processorId < processors.length; processorId++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    setTimeout(() => {
      if (!worker.exitedAfterDisconnect) {
        console.log(`Worker ${worker.process.pid} exited. Launching new process.`);
        cluster.fork();
      }
    }, 500);
  });
} else {
  const { server } = require('ful-ms-svr');
  console.log(`Running from testing. ${process.pid}`);
  server.run(port);
}
```