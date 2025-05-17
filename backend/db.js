// Handles database connection and query logic for Postgres and MySQL
const { Client: PGClient } = require('pg');
const mysql = require('mysql2/promise');

async function getPostgresSchema(conn) {
  const pgConfig = {
    host: conn.host,
    port: conn.port,
    user: conn.username,
    password: conn.password,
    database: conn.database
  };
  const client = new PGClient(pgConfig);
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  await client.end();
  return res.rows;
}

async function getMySQLSchema(conn) {
  const connection = await mysql.createConnection(conn);
  const [tables] = await connection.query('SHOW TABLES');
  let schema = {};
  for (let tbl of tables) {
    const tableName = Object.values(tbl)[0];
    const [cols] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
    schema[tableName] = cols.map(c => c.Field);
  }
  await connection.end();
  return schema;
}

module.exports = {
  getPostgresSchema,
  getMySQLSchema
};
