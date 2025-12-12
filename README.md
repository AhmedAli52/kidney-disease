# Kidney RF Detection - Dark Theme (React + Node + MySQL)

This project is a fullstack demo for Kidney RF Detection UI (dark theme) with:
- React (Vite) frontend (no Tailwind, pure CSS)
- Node + Express backend with MySQL
- Simple authentication (signup/login)
- File upload (stores files on disk, metadata in MySQL)
- Model predict endpoint (stub) — integrate your model here

## Quick start

### Backend
1. Create a MySQL database and note credentials.
2. Copy `.env.example` to `.env` in the `server` folder and update DB credentials.
3. Install and run:
   ```
   cd server
   npm install
   npm run dev
   ```

### Frontend
1. Set `VITE_API_BASE` in `client/.env` (e.g. `VITE_API_BASE=http://localhost:4002`)
2. Install and run:
   ```
   cd client
   npm install
   npm run dev
   ```

The frontend runs on port 5173 and the backend on port 4002 by default.
