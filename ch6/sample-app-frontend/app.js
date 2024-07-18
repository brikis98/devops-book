const express = require('express');

const app = express();

const backendHost =                                           
  process.env.KUBERNETES_SERVICE_HOST                         
  ? 'sample-app-backend-service'                              
  : 'localhost:8081';                                         

app.get('/', async (req, res) => {
  const response = await fetch(`http://${backendHost}`);      
  const responseBody = await response.json();                 
  res.send(`<p>Hello from <b>${responseBody.text}</b>!</p>`); 
});

module.exports = app;