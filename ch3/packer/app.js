const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Fundamentals of DevOps!\n');
});

const port = 8080;
server.listen(port,() => {
  console.log(`Listening on port ${port}`);
});
