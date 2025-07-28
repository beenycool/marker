module.exports = async function globalTeardown() {
  // Close the PostgreSQL client connection
  if (global.pgClient) {
    await global.pgClient.end();
    // eslint-disable-next-line no-console
    console.log('✅ Test database connection closed');
  }
};
