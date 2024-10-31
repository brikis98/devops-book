const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.json({text: "backend microservice"});
});

module.exports = app;