const { Client } = require('pg');

const client = new Client({
  host: 'ep-wild-paper-a5vucrvn.us-east-2.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'Dx5gHOV8Uvdu',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected successfully to database');
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();