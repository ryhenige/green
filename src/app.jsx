// App.jsx — SQL AI Dashboard: Rendered Results + Connection Testing

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { v4 as uuid } from 'uuid'

// --- Inline Styles (move outside App for lint compliance) ---
const inputStyle = {
  padding: '6px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 15,
  marginBottom: 4,
  minWidth: 120,
};
const buttonStyle = {
  padding: '7px 18px',
  background: '#edf2f7',
  border: 'none',
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 1px 3px #0001',
  marginRight: 8,
};
const textareaStyle = {
  width: '100%',
  minHeight: 60,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 15,
  padding: 8,
  marginBottom: 8,
};
const thStyle = {
  background: '#2b6cb0',
  color: '#fff',
  padding: '8px 6px',
  fontWeight: 700,
  fontSize: 15,
  borderBottom: '2px solid #bee3f8',
};
const tdStyle = {
  padding: '7px 6px',
  borderBottom: '1px solid #e2e8f0',
  fontSize: 15,
};

function App() {
  const [connections, setConnections] = useState([])
  const [activeConnection, setActiveConnection] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [prompt, setPrompt] = useState('')
  const [columns, setColumns] = useState([])
  const [connStatus, setConnStatus] = useState('')
  const [error, setError] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const [newConn, setNewConn] = useState({
    name: '', host: '', port: 5432, database: '', username: '', password: '', adapter: 'postgres'
  })

  useEffect(() => {
    window.api.getConnections().then(setConnections)
  }, [])

  const saveConnection = async () => {
    const payload = { id: uuid(), ...newConn }
    await window.api.saveConnection(payload)
    // Reload from backend to avoid stale state
    const updated = await window.api.getConnections();
    setConnections(updated);
    setActiveConnection(updated[0]);
  }

  const testConnection = async () => {
    if (!activeConnection) {
      setConnStatus('No connection selected');
      return;
    }
    console.log(activeConnection)
    const res = await window.api.queryDB({ query: 'SELECT 1', connectionId: activeConnection.id })
    setConnStatus(res.error ? `Error: ${res.error}` : 'Success: Connection OK')
  }

  const runQuery = async () => {
    if (!activeConnection) {
      alert('No connection selected');
      return;
    }
    const res = await window.api.queryDB({ query, connectionId: activeConnection.id })
    console.log('Query result:', res); // Debugging log
    if (res.error) setError(res.error)
    else {
      setResults(res.rows || [])
      setColumns(res.rows && res.rows.length > 0 ? Object.keys(res.rows[0]) : [])
      setError('');
    }
  }

  const generateSQL = async () => {
    if (!activeConnection) {
      setError('No connection selected');
      return;
    }
    setLoadingAI(true);
    try {
      const ai = await window.api.generateSQL({ prompt, connectionId: activeConnection.id })
      console.log('AI result:', ai); // Debugging log
      if (ai.error) setError(ai.error)
      else {
        setQuery(ai.sql);
        setError('');
      }
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', background: '#f7f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 32, color: '#1a202c', letterSpacing: 1 }}>SQL AI Dashboard</h1>
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>

          {/* Connection Card */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, flex: 1 }}>
            <h2 style={{ marginTop: 0, color: '#2b6cb0' }}>New Connection</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="Name" value={newConn.name} onChange={e => setNewConn({ ...newConn, name: e.target.value })} />
              <input style={inputStyle} placeholder="Host" value={newConn.host} onChange={e => setNewConn({ ...newConn, host: e.target.value })} />
              <input style={inputStyle} placeholder="Port" type="number" value={newConn.port} onChange={e => setNewConn({ ...newConn, port: Number(e.target.value) })} />
              <input style={inputStyle} placeholder="Database" value={newConn.database} onChange={e => setNewConn({ ...newConn, database: e.target.value })} />
              <input style={inputStyle} placeholder="Username" value={newConn.username} onChange={e => setNewConn({ ...newConn, username: e.target.value })} />
              <input style={inputStyle} placeholder="Password" type="password" value={newConn.password} onChange={e => setNewConn({ ...newConn, password: e.target.value })} />
              <select style={inputStyle} value={newConn.adapter} onChange={e => setNewConn({ ...newConn, adapter: e.target.value })}>
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <button style={buttonStyle} onClick={testConnection}>Test Connection</button>
              <span style={{ color: connStatus.startsWith('Success') ? '#38a169' : '#e53e3e', fontWeight: 500 }}>{connStatus}</span>
            </div>
            <button style={{ ...buttonStyle, background: '#2b6cb0', color: '#fff' }} onClick={saveConnection}>Save Connection</button>
          </div>

          {/* Recent Connections */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, flex: 0.7 }}>
            <h2 style={{ marginTop: 0, color: '#2b6cb0' }}>Recent Connections</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {connections.map(c => (
                <li
                  key={c.id}
                  onClick={() => setActiveConnection(c)}
                  style={{
                    cursor: 'pointer',
                    fontWeight: activeConnection?.id === c.id ? 'bold' : 'normal',
                    color: activeConnection?.id === c.id ? '#2b6cb0' : '#222',
                    background: activeConnection?.id === c.id ? '#ebf8ff' : 'transparent',
                    borderRadius: 6,
                    padding: '4px 8px',
                    marginBottom: 2,
                  }}
                >
                  {c.name} <span style={{ fontSize: 13, color: '#888' }}>({c.adapter})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Prompt Section */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, marginBottom: 32 }}>
          <h2 style={{ color: '#2b6cb0' }}>AI SQL (Natural Language)</h2>
          <textarea style={textareaStyle} value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} cols={100} placeholder="e.g. List users with total orders" />
          <br />
          <button style={buttonStyle} onClick={generateSQL} disabled={loadingAI}>
            {loadingAI ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #2b6cb0', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                Generating...
              </span>
            ) : 'Generate SQL'}
          </button>
          {/* Spinner animation keyframes */}
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Query Section */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, marginBottom: 32 }}>
          <h2 style={{ color: '#2b6cb0' }}>Run SQL</h2>
          <textarea style={textareaStyle} value={query} onChange={e => setQuery(e.target.value)} rows={4} cols={100} />
          <br />
          <button style={buttonStyle} onClick={runQuery}>Run Query</button>
        </div>

        {/* Results Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24, marginBottom: 32 }}>
          <h2 style={{ color: '#2b6cb0' }}>Results</h2>
          {columns.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', minWidth: 600, width: '100%', background: '#fafbfc' }}>
                <thead>
                  <tr>{columns.map(col => <th key={col} style={thStyle}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#f7fafc' : '#fff' }}>
                      {columns.map(col => <td key={col} style={tdStyle}>{String(row[col])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <div style={{ color: '#e53e3e', marginTop: 12 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />)
