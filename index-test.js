const { server, registerServer, unregisterServer } = require('./index.js');
let port = parseInt(process.argv[2] || 3000);
console.log(`Running from testing. ${process.pid}`);
server.port = port;
server.registerServer = registerServer;
server.unregisterServer = unregisterServer;
server.discoveryHost = process.argv[3] || '127.0.0.1';
server.discoveryPort = parseInt(process.argv[4] || 81);
server.run(port);