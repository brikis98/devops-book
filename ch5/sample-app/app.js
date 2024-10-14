const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Fundamentals of Devops!');
});

module.exports = app;
