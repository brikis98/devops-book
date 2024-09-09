const knex = require('knex');
const knexConfig = require('./knexfile.js');   
const knexClient = knex(knexConfig);           

exports.handler = async (event, context) => {
  const result = await knexClient('customers') 
    .select()
    .where('date_of_birth', '>', '1950-12-31');
  return {                                     
    statusCode: 200,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({result})
  };
};