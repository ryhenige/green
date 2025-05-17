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
const encoder = require('gpt-3-encoder');

async function generateSQL({ conn, prompt, schemaText }) {
  const promptText = SYSTEM_PROMPT({ adapter: conn.adapter, schemaText });
  const fullPrompt = `${promptText} User asked: ${prompt}`;
  const promptTokens = encoder.encode(fullPrompt).length;

  console.log('[Ollama prompt]:', promptText);
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'mistral',
    prompt: fullPrompt,
    stream: false
  });
  let sql = response.data.response.trim();
  const responseTokens = encoder.encode(sql).length;
  console.log('[Ollama raw response]:', sql);
  console.log(`[Token usage] Prompt: ${promptTokens}, Response: ${responseTokens}, Total: ${promptTokens + responseTokens}`);
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
