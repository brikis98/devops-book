const express = require('express');

const app = express();
app.set('view engine', 'ejs');

const backendHost = 'sample-app-backend-service';             

app.get('/', async (req, res) => {
  const response = await fetch(`http://${backendHost}`);      
  const responseBody = await response.json();                 
  res.render('hello', {name: responseBody.text});             
});

module.exports = app;