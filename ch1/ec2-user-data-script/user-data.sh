#!/usr/bin/env bash

set -e

curl -fsSL https://rpm.nodesource.com/setup_21.x | bash -
yum install -y nodejs

tee app.js > /dev/null << "EOF"
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!\n');
});

const port = process.env.PORT || 80;
server.listen(port,() => {
  console.log(`Listening on port ${port}`);
});
EOF

nohup node app.js &