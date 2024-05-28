const express = require('express');

const app = express();

app.get('/', (req, res) => {
  if (lookupFeatureToggle(req, "HOME_PAGE_FLAVOR") === "v2") { 
    res.send(newFancyHomepage());                              
  } else {
    res.send('Hello, World!');                                 
  }
});

// A fake implementation of looking up a feature toggle. A real implementation would use a feature toggle service.
function lookupFeatureToggle(req, name) {
  return "v2";
}

// A fake implementation of a new home page implementation
function newFancyHomepage() {
  return 'Fundamentals of DevOps!';
}

module.exports = app;