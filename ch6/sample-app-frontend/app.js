const express = require('express');

const app = express();
app.set('view engine', 'ejs');

const backendHost = 'http://sample-app-backend-service'; 

app.get('/', async (req, res) => {
  const response = await fetch(backendHost);             
  const responseBody = await response.json();            
  res.render('hello', {name: responseBody.text});        
});

module.exports = app;