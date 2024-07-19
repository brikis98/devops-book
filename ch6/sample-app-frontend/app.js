const express = require('express');

const app = express();

const backendHost = 'sample-app-backend-service';             

app.get('/', async (req, res) => {
  const response = await fetch(`http://${backendHost}`);      
  const responseBody = await response.json();                 
  res.send(`<p>Hello from <b>${responseBody.text}</b>!</p>`); 
});

module.exports = app;