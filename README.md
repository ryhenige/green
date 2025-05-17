# Electron SQL AI App

## Getting Started

This project is an Electron-based SQL dashboard with AI-powered query generation and multi-database support (Postgres, SQLite, MySQL).

---

## Prerequisites

- **Node.js** (v16 or later)
- **npm**
- **Electron** (installed via npm)
- **Ollama** (for local AI/LLM inference, if using AI features)
- **Postgres**/**MySQL** (optional, for external DB connections)

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd green
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install additional native dependencies (if needed):**
   - For Postgres support:
     ```bash
     npm install pg
     ```
   - For MySQL support:
     ```bash
     npm install mysql2
     ```

4. **(Optional) Start Ollama LLM server:**
   - Install from https://ollama.com/
   - Start with a model, e.g.:
     ```bash
     ollama run mistral
     ```

---

## Running the App

```bash
npm start
```

- The Electron app will launch.
- By default, it uses a local SQLite database to store connection info.
- You can add Postgres/MySQL connections from the UI.

---

## Project Structure

- `main.js` — Electron app entrypoint (minimal, only setup)
- `backend/` — All backend logic and IPC handlers
  - `db.js` — Database connection & schema
  - `ai.js` — AI prompt & LLM calls
  - `utils.js` — Utility functions
  - `ipcHandlers.js` — All IPC handlers
  - `prompts.js` — AI prompts
- `src/` — Frontend React app

---

## Features

- **Connect to SQLite, Postgres, MySQL**
- **Generate SQL from natural language (AI/LLM)**
- **Run queries and view results**
- **Strict validation for SQL execution (SELECT-only by default)**

---

## Troubleshooting

- If you see `no such table: users`, make sure you are connected to the correct database and that the table exists.
- For AI errors, ensure Ollama is running and accessible at `localhost:11434` (or update the backend config).
- For Postgres/MySQL, ensure the `pg`/`mysql2` package is installed and the DB is reachable from your machine.

---

## License

MIT
