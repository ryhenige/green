// Handles AI/LLM prompt construction and Ollama API calls
const axios = require('axios');
const { isStrictSelect } = require('./utils');

const systemTables = ['ar_internal_metadata', 'schema_migrations'];

function buildSchemaText(schemaRows) {
  // Exclude system tables from schema prompt
  const schema = schemaRows.reduce((acc, row) => {
    if (!systemTables.includes(row.table_name)) {
      acc[row.table_name] = acc[row.table_name] || [];
      acc[row.table_name].push(row.column_name);
    }
    return acc;
  }, {});
  return Object.entries(schema)
    .map(([table, cols]) => `${table}(${cols.join(', ')})`).join(', ');
}

const { SYSTEM_PROMPT } = require('./prompts');

async function generateSQL({ conn, prompt, schemaText }) {
  const promptText = SYSTEM_PROMPT({ adapter: conn.adapter, schemaText });
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'mistral',
    prompt: `${promptText} User asked: ${prompt}`,
    stream: false
  });
  let sql = response.data.response.trim();
  console.log('[Ollama raw response]:', sql);
  // Remove a single trailing semicolon (and whitespace)
  sql = sql.replace(/;\s*$/, '');
  if (!isStrictSelect(sql)) {
    return { error: 'Generated SQL is not a valid single SELECT statement.' };
  }
  return { sql };
}

module.exports = {
  buildSchemaText,
  generateSQL
};
