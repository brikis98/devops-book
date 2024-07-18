exports.handler = (event, context, callback) => {
  callback(null, {statusCode: 200, body: `Hello from ${process.env.NODE_ENV}!`});
};