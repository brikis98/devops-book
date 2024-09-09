const knex = require('knex');
const knexConfig = require('./knexfile.js'); 
const knexClient = knex(knexConfig);         

exports.handler = async (event, context) => {
  await knexClient.migrate.latest();         
  return {success: true};                    
};

