#!/usr/bin/env bash

set -e

curl -fsSL https://rpm.nodesource.com/setup_21.x | bash -
yum install -y nodejs

export MY_IP=$(hostname -I)                      

tee app.js > /dev/null << "EOF"
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from ${process.env.MY_IP}!\n`); 
});

const port = 80;
server.listen(port,() => {
  console.log(`Listening on port ${port}`);
});
EOF

nohup node app.js &