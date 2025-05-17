const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getConnections: () => ipcRenderer.invoke('get-connections'),
  queryDB: ({ query, connectionId }) => ipcRenderer.invoke('query-db', { query, connectionId }),
  generateSQL: ({ prompt, connectionId }) => ipcRenderer.invoke('ai-to-sql', { prompt, connectionId }),
  saveConnection: (data) => ipcRenderer.invoke('save-connection', data)
})
