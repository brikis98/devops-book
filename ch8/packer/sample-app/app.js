const https = require('https');                                             

const secretsMgr = require('@aws-sdk/client-secrets-manager');
const client = new secretsMgr.SecretsManagerClient({region: 'us-east-2'});

(async () => {                                                              
  const response = await client.send(new secretsMgr.GetSecretValueCommand({ 
    SecretId: 'certificate'
  }));

  const options = JSON.parse(response.SecretString);                        

  const server = https.createServer(options, (req, res) => {                
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!\n');                                             
  });

  const port = process.env.PORT || 443;                                     
  server.listen(port,() => {
    console.log(`Listening on port ${port}`);
  });
})();

