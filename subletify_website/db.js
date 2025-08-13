const { Pool } = require('pg');

const pool = new Pool({
  user: 'cse437group5',
  host: 'localhost', 
  database: 'subletifydev_v2',
  password: 'swe workshop',
  port: 5432,
});
console.log('Attempting to connect to the database...');
pool.connect()
  .then(client => {
    console.log('Connected to the database successfully');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.stack);
  });
module.exports = pool; 
