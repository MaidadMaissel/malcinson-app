const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = path.resolve(process.env.DB_PATH || './malcinson.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema();
    saveDb();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_level (
      level_id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_name TEXT NOT NULL UNIQUE,
      hourly_rate REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS employee (
      phone TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level_id INTEGER REFERENCES employee_level(level_id),
      is_manager INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS project (
      project_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      client_name TEXT,
      client_phone TEXT,
      client_address TEXT,
      client_email TEXT,
      contract_price REAL DEFAULT 0,
      target_cost REAL DEFAULT 0,
      target_date TEXT,
      contract_closed_date TEXT,
      materials_ordered_date TEXT,
      construction_start_date TEXT,
      delivery_date TEXT,
      project_location TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS employee_project (
      phone TEXT REFERENCES employee(phone),
      project_id INTEGER REFERENCES project(project_id),
      PRIMARY KEY (phone, project_id)
    );

    CREATE TABLE IF NOT EXISTS work_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL REFERENCES employee(phone),
      project_id INTEGER REFERENCES project(project_id),
      work_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      payment_status TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL REFERENCES employee(phone),
      project_id INTEGER REFERENCES project(project_id),
      item_description TEXT NOT NULL,
      amount REAL NOT NULL,
      invoice_image TEXT,
      payment_status TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL REFERENCES employee(phone),
      amount REAL NOT NULL,
      note TEXT,
      paid_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default data
  db.run(`INSERT OR IGNORE INTO employee_level (level_name, hourly_rate) VALUES ('עובד כללי', 40);`);
  db.run(`INSERT OR IGNORE INTO employee_level (level_name, hourly_rate) VALUES ('נגר', 55);`);
  db.run(`INSERT OR IGNORE INTO employee_level (level_name, hourly_rate) VALUES ('חשמלאי', 60);`);
  db.run(`INSERT OR IGNORE INTO employee_level (level_name, hourly_rate) VALUES ('מנהל עבודה', 70);`);

  db.run(`INSERT OR IGNORE INTO employee (phone, name, level_id, is_manager) VALUES ('0500000001', 'ישראל ישראלי', 4, 1);`);
  db.run(`INSERT OR IGNORE INTO employee (phone, name, level_id, is_manager) VALUES ('0500000002', 'משה כהן', 1, 0);`);
  db.run(`INSERT OR IGNORE INTO employee (phone, name, level_id, is_manager) VALUES ('0500000003', 'דוד לוי', 2, 0);`);

  db.run(`INSERT OR IGNORE INTO project (project_id, project_name, client_name, client_phone, contract_price, target_date, project_location, is_active)
    VALUES (1, 'בניין רמת גן', 'אברהם דוד', '0521234567', 250000, '2026-06-01', 'רמת גן', 1);`);
  db.run(`INSERT OR IGNORE INTO project (project_id, project_name, client_name, client_phone, contract_price, target_date, project_location, is_active)
    VALUES (2, 'שיפוץ תל-אביב', 'שרה לוי', '0539876543', 80000, '2026-03-15', 'תל אביב', 1);`);
}

module.exports = { getDb, saveDb };
