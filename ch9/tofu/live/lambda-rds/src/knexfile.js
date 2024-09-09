const fs = require('fs').promises;

module.exports = {
  
  client: 'postgresql',

  connection: async () => {
    
    const rdsCaCert = await fs.readFile('rds-us-east-2-ca-cert.pem');

    
    return {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: {rejectUnauthorized: true, ca: rdsCaCert.toString()}
    }
  }
};
