// Registers all Electron IPC handlers
const { ipcMain } = require('electron');
const { getPostgresSchema, getMySQLSchema } = require('./db');
const { buildSchemaText, generateSQL } = require('./ai');

const sqlite = global.sqlite;
const uuid = global.uuid;

// IPC: Get saved connections
ipcMain.handle('get-connections', () => {
  return sqlite.prepare(`SELECT * FROM connections ORDER BY last_used_at DESC`).all();
});

// IPC: Save a new DB connection
ipcMain.handle('save-connection', (event, conn) => {
  const stmt = sqlite.prepare(`INSERT OR REPLACE INTO connections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(
    conn.id || uuid(),
    conn.name,
    conn.host,
    conn.port,
    conn.database,
    conn.username,
    conn.password,
    conn.adapter || 'postgres',
    new Date().toISOString()
  );
  return { success: true };
});

// Example: ai-to-sql handler
ipcMain.handle('ai-to-sql', async (event, { prompt, connectionId }) => {
  // Fetch the connection from the SQLite 'connections' table
  let conn = sqlite.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId);
  if (!conn) return { error: 'No saved connection available.' };

  let schemaRows, schemaText;
  if (conn.adapter === 'postgres') {
    schemaRows = await getPostgresSchema(conn);
    schemaText = buildSchemaText(schemaRows);
  } else if (conn.adapter === 'mysql') {
    // Not implemented in this stub
    return { error: 'MySQL AI not implemented yet.' };
  } else {
    return { error: 'Unsupported adapter for AI SQL.' };
  }

  return await generateSQL({ conn, prompt, schemaText });
});

// IPC: Query DB (for SQLite only, extend as needed)
const { Pool } = require('pg'); // make sure to install pg

ipcMain.handle('query-db', async (event, payload = {}) => {
  const sql = (payload.sql || payload.query || '').trim();
  const connectionId = payload.connectionId;
  try {
    if (!sql) return { error: 'No SQL provided.' };
    if (!/^select\b/i.test(sql)) return { error: 'Only SELECT queries are allowed.' };

    // Fetch the connection info from your SQLite store
    const conn = sqlite.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId);
    if (!conn) return { error: 'No connection found.' };

    if (conn.adapter === 'postgres') {
      const pool = new Pool({
        host: conn.host,
        port: conn.port,
        database: conn.database,
        user: conn.username,
        password: conn.password,
      });
      const result = await pool.query(sql);
      await pool.end();
      return { rows: result.rows };
    } else if (conn.adapter === 'sqlite') {
      const rows = sqlite.prepare(sql).all();
      return { rows };
    } else {
      return { error: 'Unsupported adapter.' };
    }
  } catch (err) {
    return { error: err.message };
  }
});
// Other handlers (queryDB, saveConnection, etc.) would be registered here
