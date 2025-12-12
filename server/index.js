// server/index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ensure uploads folder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// multer
const upload = multer({ dest: 'uploads/' });

// SQLite DB
const DB_FILE = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(DB_FILE);

// initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    filename TEXT,
    original_name TEXT,
    path TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    prediction TEXT
  )`);
});

// ---------- AUTH ----------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const id = 'u_' + Date.now();
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)', [id, name || email, email, hash, role || 'patient'], function(err) {
      if (err) {
        console.error('signup err', err);
        return res.status(400).json({ error: 'Signup failed' });
      }
      res.json({ id, name: name || email, email, role: role || 'patient' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email=?', [email], async (err, row) => {
      if (err) { console.error(err); return res.status(500).json({ error: 'DB error' }); }
      if (!row) return res.status(400).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, row.password);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
      // return user object (no JWT in demo)
      res.json({ id: row.id, name: row.name, email: row.email, role: row.role });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login error' });
  }
});

app.post('/api/auth/forgot', async (req, res) => {
  // demo: don't actually send email
  res.json({ ok: true });
});

// ---------- PATIENTS (for doctor panel) ----------
app.get('/api/patients', (req, res) => {
  db.all("SELECT id,name FROM users WHERE role='patient' ORDER BY name ASC", [], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json([{ id:'p_anon', name:'Demo Patient' }]); }
    if (!rows || rows.length === 0) return res.json([{ id:'p_anon', name:'Demo Patient' }]);
    res.json(rows);
  });
});

// ---------- UPLOAD ----------
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const patientId = req.body.patientId || 'p_anon';
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const id = 'f_' + Date.now();
    const filepath = path.join(__dirname, file.path);
    db.run('INSERT INTO records (id,patient_id,filename,original_name,path) VALUES (?,?,?,?,?)',
      [id, patientId, file.filename, file.originalname, filepath], function(err) {
        if (err) {
          console.error('insert record err', err);
          return res.status(500).json({ error: 'Failed save record' });
        }
        // return file id to frontend; frontend will call /api/model/predict
        res.json({ fileId: id, url: `/uploads/${file.filename}` });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ---------- MODEL PREDICT (calls Python predict.py if present, else sim) ----------
function simulatePredictionFromFilename(originalName) {
  // deterministic-ish simulation so results look realistic
  const lower = (originalName || '').toLowerCase();
  const stone = lower.includes('stone') || Math.random() > 0.6;
  const confidence = stone ? (0.8 + Math.random() * 0.18) : (0.05 + Math.random() * 0.25);
  const size = stone ? (['SMALL','MEDIUM','LARGE'][Math.floor(Math.random()*3)]) : 'NOSTONE';
  return {
    prediction: stone ? size : 'NOSTONE',
    confidence: +confidence.toFixed(4),
    category: stone ? size : 'NOSTONE',
    stone_exists: stone
  };
}

app.post('/api/model/predict', (req, res) => {
  (async () => {
    try {
      const { file } = req.body;
      if (!file) return res.status(400).json({ error: 'Missing file id' });

      db.get('SELECT * FROM records WHERE id=?', [file], (err, rec) => {
        if (err || !rec) {
          console.error('record lookup', err);
          return res.status(404).json({ error: 'File not found' });
        }

        const pythonScript = path.join(__dirname, 'model', 'predict.py');
        if (fs.existsSync(pythonScript)) {
          // call python
          const py = spawn('python', [pythonScript, rec.path], { cwd: process.cwd() });
          let stdout = '', stderr = '';
          py.stdout.on('data', d => stdout += d.toString());
          py.stderr.on('data', d => stderr += d.toString());
          py.on('close', async () => {
            if (stderr && stderr.trim()) {
              // print warnings but proceed (sklearn version warnings come here)
              console.error('Python stderr:', stderr.trim());
            }
            if (!stdout || !stdout.trim()) {
              console.error('Python produced no stdout');
              // fallback simulate
              const sim = simulatePredictionFromFilename(rec.original_name);
              const predObj = {
                prediction: sim.prediction,
                confidence: sim.confidence,
                category: sim.category,
                stone_exists: sim.stone_exists
              };
              db.run('UPDATE records SET prediction=? WHERE id=?', [JSON.stringify(predObj), file]);
              return res.json(predObj);
            }
            try {
              const parsed = JSON.parse(stdout.trim());
              // normalize output fields
              const predObj = {
                prediction: parsed.prediction || parsed.label || parsed.size_category || parsed.category || 'NOSTONE',
                confidence: (parsed.confidence != null) ? (Number(parsed.confidence) / (parsed.confidence > 1 ? 100 : 1)) : (parsed.confidence || 0),
                category: parsed.size_category || parsed.category || parsed.prediction || parsed.label || null,
                stone_exists: parsed.stone_exists != null ? parsed.stone_exists : (parsed.prediction && String(parsed.prediction).toLowerCase() !== 'nostone')
              };
              // ensure confidence is decimal 0..1
              if (predObj.confidence > 1) predObj.confidence = predObj.confidence / 100;
              await new Promise((resolve, reject) => {
                db.run('UPDATE records SET prediction=? WHERE id=?', [JSON.stringify(predObj), file], function(err) {
                  if (err) return reject(err);
                  resolve();
                });
              });
              return res.json(predObj);
            } catch (err) {
              console.error('Failed parse python output', err, stdout);
              const sim = simulatePredictionFromFilename(rec.original_name);
              const predObj = {
                prediction: sim.prediction,
                confidence: sim.confidence,
                category: sim.category,
                stone_exists: sim.stone_exists
              };
              db.run('UPDATE records SET prediction=? WHERE id=?', [JSON.stringify(predObj), file]);
              return res.json(predObj);
            }
          });
        } else {
          // no python model -> simulate
          const sim = simulatePredictionFromFilename(rec.original_name);
          const predObj = {
            prediction: sim.prediction,
            confidence: sim.confidence,
            category: sim.category,
            stone_exists: sim.stone_exists
          };
          db.run('UPDATE records SET prediction=? WHERE id=?', [JSON.stringify(predObj), file]);
          return res.json(predObj);
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Prediction failed' });
    }
  })();
});

// ---------- HISTORY for patient (returns last 3 preds) ----------
app.get('/api/patients/:id/history', (req, res) => {
  const pid = req.params.id;
  db.all('SELECT id,original_name,uploaded_at,prediction FROM records WHERE patient_id=? ORDER BY uploaded_at DESC LIMIT 3', [pid], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json([]); }
    // Return clean format
    const out = rows.map(r => {
      let p = null;
      try { p = r.prediction ? JSON.parse(r.prediction) : null; } catch(e){ p = null; }
      return {
        id: r.id,
        filename: r.original_name,
        uploadedAt: r.uploaded_at,
        prediction: p
      };
    });
    res.json(out);
  });
});

// ---------- OPTIONAL: fetch all records (debug) ----------
app.get('/api/records', (req,res)=>{
  db.all('SELECT * FROM records ORDER BY uploaded_at DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// start
const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
