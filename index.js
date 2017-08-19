'use require';
const express = require('express');
const http = require('http');
const server = express();
const ifaces = require('os').networkInterfaces();

// Get the ipv4 address from which the server is running
Object.keys(ifaces).forEach(ifname => {
  ifaces[ifname].forEach(iface => {
    if (!server.host && iface.family === 'IPv4' && iface.internal) {
      server.ipAddress4 = iface.address;
    }
    if (!server.host && iface.family === 'IPv6' && iface.internal) {
      server.ipAddress6 = iface.address;
    }
  });
});

function listen() {
  server.listen(server.port, () => {
    if (server.registerServer) {
      server.registerServer().then(msg => {
        console.log(msg);
      }).catch(err => {
        console.log(`Error registering server. Code ${err.code} Call ${err.syscall} Address ${err.address} Port ${err.port}`);
      });
    }
    console.log(`Server on port ${server.port}`);
  });
};

server.run = function (port) {
  if (port > 0) {
    server.port = port;
    return listen();
  }
  require('get-port')().then(randomPort => {
    server.port = randomPort;
    return listen();
  });
};

function registerServer () {
  return new Promise((resolve, reject) => {
    let payload = JSON.stringify({
      host: server.ipAddress4,
      port: server.port
    });
    let req = http.request({
      host: server.discoveryHost,
      port: server.discoveryPort,
      path: '/api/sockets',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      res.on('data', data => {
        console.log(`Register server data: ${data}`);
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(res);
        }
        resolve(`Register server status: ${res.statusCode}`);
      });
    });
    req.on('error', error => {
      reject(error);
    });
    req.write(payload);
    req.end();
  });
};

function unregisterServer () {
  console.log(`Unregistering server`);
  let req = http.request({
    host: server.discoveryHost,
    port: server.discoveryPort,
    path: `/api/sockets?host=${server.ipAddress4}&port=${server.port}`,
    method: 'DELETE'
  }, res => {
    res.on('data', data => {
      console.log(`Unregister server data: ${data}`);
    });

    res.on('end', () => {
      console.log(`Unregister server status: ${res.statusCode}`);
      process.exit();
    });
  });
  req.on('error', error => {
    console.log(`Unregister error: ${error}`);
    process.exit();
  });
  req.end();
};

server.get('/api/status', (req, res) => {
  if (req.query.all === 'true') {
    return res.json({
      id: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage()
    });
  }
  res.json({
    uptime: process.uptime()
  });
});

// Will only work on graceful shutdowns or with message shutdown-ms
function onExit () {
  if (!server.unregisterServer) {
    process.exit();
  }
  server.unregisterServer();
};

// Unregister server on the discovery server
process.on('exit', code => console.log(`Exiting with code ${code}`));
process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);
process.on('SIGHUP', onExit);
process.on('uncaughtException', onExit);

module.exports = {
  server: server,
  registerServer: registerServer,
  unregisterServer: unregisterServer
};