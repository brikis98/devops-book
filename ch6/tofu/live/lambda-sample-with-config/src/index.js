const config = require(`./config/${process.env.ENV_NAME}.json`)          

exports.handler = (event, context, callback) => {
  callback(null, {statusCode: 200, body: `Hello from ${config.text}!`}); 
};