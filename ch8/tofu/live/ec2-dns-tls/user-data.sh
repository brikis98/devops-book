#!/usr/bin/env bash

set -e

curl -fsSL https://rpm.nodesource.com/setup_21.x | bash -
yum install -y nodejs

export CERTIFICATE=$(aws secretsmanager get-secret-value \
  --region us-east-2 \
  --secret-id certificate \
  --output text \
  --query SecretString)

tee app.js > /dev/null << "EOF"
const https = require('https');

const options = JSON.parse(process.env.CERTIFICATE);

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!\n');
});

const port = 443;
server.listen(port,() => {
  console.log(`Listening on port ${port}`);
});
EOF

nohup node app.js &