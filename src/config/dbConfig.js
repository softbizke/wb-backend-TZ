require('dotenv').config();

const dbConfig = {
  user: 'postgres',
  password:'p@ssport1X',
  host: 'localhost',
  database: 'TOS',
  port: 5432 
};

module.exports = {
  dbConfig
};


