const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 4000;
const ROOT_DIR = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'db');
const DB_PATH = path.join(DB_DIR, 'aa2zee.sqlite');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({ storage });
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      company_address TEXT,
      company_number TEXT,
      company_site_link TEXT,
      key_contact_name TEXT,
      key_contact_number TEXT,
      key_contact_email TEXT,
      warehouse_space TEXT,
      docking_spots TEXT,
      fbm_separate_area TEXT,
      fbm_space TEXT,
      pnp_automated TEXT,
      pnp_system_name TEXT,
      pnp_method TEXT,
      vas_time_work_method TEXT,
      vas_billing_method TEXT,
      b2b_stores_handled TEXT,
      b2b_routing_handled TEXT,
      b2b_bol_handled TEXT,
      pod_por_scan_available TEXT,
      web_access_24x7 TEXT,
      rate_list_rows_json TEXT,
      rate_list_file_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

const normalizeBool = (value) => {
  if (value === true || value === 'true' || value === 'yes' || value === 'on') return 'yes';
  return 'no';
};

const parseRateRows = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aa2zee-3pl-api' });
});

app.post('/api/accounts', upload.single('rate_list_file'), (req, res) => {
  const body = req.body;
  const rateRows = parseRateRows(body.rate_list_rows_json);

  if (!body.company_name) {
    return res.status(400).json({ error: 'company_name is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO accounts (
      company_name, company_address, company_number, company_site_link,
      key_contact_name, key_contact_number, key_contact_email,
      warehouse_space, docking_spots,
      fbm_separate_area, fbm_space,
      pnp_automated, pnp_system_name, pnp_method,
      vas_time_work_method, vas_billing_method,
      b2b_stores_handled, b2b_routing_handled, b2b_bol_handled,
      pod_por_scan_available, web_access_24x7,
      rate_list_rows_json, rate_list_file_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    body.company_name,
    body.company_address || '',
    body.company_number || '',
    body.company_site_link || '',
    body.key_contact_name || '',
    body.key_contact_number || '',
    body.key_contact_email || '',
    body.warehouse_space || '',
    body.docking_spots || '',
    normalizeBool(body.fbm_separate_area),
    body.fbm_space || '',
    normalizeBool(body.pnp_automated),
    body.pnp_system_name || '',
    body.pnp_method || '',
    body.vas_time_work_method || '',
    body.vas_billing_method || '',
    normalizeBool(body.b2b_stores_handled),
    normalizeBool(body.b2b_routing_handled),
    normalizeBool(body.b2b_bol_handled),
    normalizeBool(body.pod_por_scan_available),
    normalizeBool(body.web_access_24x7),
    JSON.stringify(rateRows),
    req.file ? `/uploads/${req.file.filename}` : '',
    function insertCallback(error) {
      if (error) {
        return res.status(500).json({ error: 'Failed to create account', detail: error.message });
      }
      return res.status(201).json({ id: this.lastID, message: 'Account created successfully' });
    }
  );

  stmt.finalize();
});

app.get('/api/accounts/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM accounts WHERE id = ?', [id], (error, row) => {
    if (error) return res.status(500).json({ error: 'Failed to fetch account' });
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const response = {
      ...row,
      rate_list_rows_json: parseRateRows(row.rate_list_rows_json)
    };

    return res.json(response);
  });
});

app.put('/api/accounts/:id', upload.single('rate_list_file'), (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const rateRows = parseRateRows(body.rate_list_rows_json);

  db.get('SELECT * FROM accounts WHERE id = ?', [id], (fetchErr, existing) => {
    if (fetchErr) return res.status(500).json({ error: 'Failed to verify account' });
    if (!existing) return res.status(404).json({ error: 'Account not found' });

    const updatedFilePath = req.file ? `/uploads/${req.file.filename}` : existing.rate_list_file_path;

    db.run(
      `
      UPDATE accounts
      SET company_name = ?,
          company_address = ?,
          company_number = ?,
          company_site_link = ?,
          key_contact_name = ?,
          key_contact_number = ?,
          key_contact_email = ?,
          warehouse_space = ?,
          docking_spots = ?,
          fbm_separate_area = ?,
          fbm_space = ?,
          pnp_automated = ?,
          pnp_system_name = ?,
          pnp_method = ?,
          vas_time_work_method = ?,
          vas_billing_method = ?,
          b2b_stores_handled = ?,
          b2b_routing_handled = ?,
          b2b_bol_handled = ?,
          pod_por_scan_available = ?,
          web_access_24x7 = ?,
          rate_list_rows_json = ?,
          rate_list_file_path = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        body.company_name || existing.company_name,
        body.company_address || '',
        body.company_number || '',
        body.company_site_link || '',
        body.key_contact_name || '',
        body.key_contact_number || '',
        body.key_contact_email || '',
        body.warehouse_space || '',
        body.docking_spots || '',
        normalizeBool(body.fbm_separate_area),
        body.fbm_space || '',
        normalizeBool(body.pnp_automated),
        body.pnp_system_name || '',
        body.pnp_method || '',
        body.vas_time_work_method || '',
        body.vas_billing_method || '',
        normalizeBool(body.b2b_stores_handled),
        normalizeBool(body.b2b_routing_handled),
        normalizeBool(body.b2b_bol_handled),
        normalizeBool(body.pod_por_scan_available),
        normalizeBool(body.web_access_24x7),
        JSON.stringify(rateRows),
        updatedFilePath,
        id
      ],
      (error) => {
        if (error) return res.status(500).json({ error: 'Failed to update account', detail: error.message });
        return res.json({ id: Number(id), message: 'Account updated successfully' });
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`AA2ZEE 3PL API running at http://localhost:${PORT}`);
});
