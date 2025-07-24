const { Client } = require('pg');

module.exports = async function globalSetup() {
  // Create a PostgreSQL client to connect to the test database
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'testuser',
    password: 'testpass',
    database: 'aimarker_test',
  });

  try {
    // Connect to the database
    await client.connect();
    
    // Set global variables for tests to use
    global.pgClient = client;
    
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
};