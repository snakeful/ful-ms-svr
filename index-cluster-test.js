const cluster = require('cluster');
const processors = require('os').cpus();
let port = parseInt(process.argv[2] || 3000);
if (cluster.isMaster) {
  const { server, registerServer, unregisterServer } = require('./index.js');
  server.port = port;
  server.discoveryHost = process.argv[3] || '127.0.0.1';
  server.discoveryPort = parseInt(process.argv[4] || 81);
  server.socketId = 'default';
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
  const { server } = require('./index.js');
  console.log(`Running from testing. ${process.pid}`);
  server.run(port);
}