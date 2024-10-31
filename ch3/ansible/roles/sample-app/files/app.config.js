module.exports = {
  apps : [{
    name   : "sample-app",
    script : "./app.js",       
    exec_mode: "cluster",      
    instances: "max",
    env: {
      "NODE_ENV": "production" 
    }
  }]
}