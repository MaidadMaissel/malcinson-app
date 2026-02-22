const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database');
const { requireAuth, requireManager } = require('../middleware/auth');

function rowsToObjects(rows) {
    if (!rows || !rows.length) return [];
    const cols = rows[0].columns;
    return rows[0].values.map(row => {
        const obj = {}; cols.forEach((c, i) => obj[c] = row[i]); return obj;
    });
}

// GET /api/projects
router.get('/', requireAuth, async (req, res) => {
    const db = await getDb();
    const rows = db.exec(`SELECT * FROM project ORDER BY is_active DESC, project_id DESC`);
    res.json(rowsToObjects(rows));
});

// GET /api/projects/:id
router.get('/:id', requireAuth, async (req, res) => {
    const db = await getDb();
    const rows = db.exec(`SELECT * FROM project WHERE project_id=?`, [req.params.id]);
    const project = rowsToObjects(rows)[0];
    if (!project) return res.status(404).json({ error: 'פרויקט לא נמצא' });

    // Get workers assigned
    const wRows = db.exec(`
    SELECT e.phone, e.name FROM employee_project ep
    JOIN employee e ON ep.phone = e.phone
    WHERE ep.project_id = ?`, [req.params.id]);
    project.workers = rowsToObjects(wRows);
    res.json(project);
});

// POST /api/projects
router.post('/', requireAuth, requireManager, async (req, res) => {
    const {
        project_name, client_name, client_phone, client_address, client_email,
        contract_price, target_cost, target_date, project_location
    } = req.body;
    if (!project_name) return res.status(400).json({ error: 'שם פרויקט נדרש' });
    const db = await getDb();
    db.run(`
    INSERT INTO project (project_name, client_name, client_phone, client_address, client_email,
      contract_price, target_cost, target_date, project_location)
    VALUES (?,?,?,?,?,?,?,?,?)`,
        [project_name, client_name || null, client_phone || null, client_address || null, client_email || null,
            contract_price || 0, target_cost || 0, target_date || null, project_location || null]);
    saveDb();
    const rows = db.exec(`SELECT * FROM project ORDER BY project_id DESC LIMIT 1`);
    res.json(rowsToObjects(rows)[0]);
});

// PUT /api/projects/:id
router.put('/:id', requireAuth, requireManager, async (req, res) => {
    const {
        project_name, client_name, client_phone, client_address, client_email,
        contract_price, target_cost, target_date, project_location, is_active,
        contract_closed_date, materials_ordered_date, construction_start_date, delivery_date
    } = req.body;
    const db = await getDb();
    db.run(`
    UPDATE project SET
      project_name=?, client_name=?, client_phone=?, client_address=?, client_email=?,
      contract_price=?, target_cost=?, target_date=?, project_location=?, is_active=?,
      contract_closed_date=?, materials_ordered_date=?, construction_start_date=?, delivery_date=?
    WHERE project_id=?`,
        [project_name, client_name || null, client_phone || null, client_address || null, client_email || null,
            contract_price || 0, target_cost || 0, target_date || null, project_location || null,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            contract_closed_date || null, materials_ordered_date || null,
            construction_start_date || null, delivery_date || null,
            req.params.id]);
    saveDb();
    res.json({ success: true });
});

// POST /api/projects/:id/workers - set workers on project
router.post('/:id/workers', requireAuth, requireManager, async (req, res) => {
    const { phones } = req.body; // array of phone strings
    const db = await getDb();
    db.run(`DELETE FROM employee_project WHERE project_id=?`, [req.params.id]);
    if (phones && phones.length) {
        for (const phone of phones) {
            db.run(`INSERT OR IGNORE INTO employee_project (phone, project_id) VALUES (?,?)`, [phone, req.params.id]);
        }
    }
    saveDb();
    res.json({ success: true });
});

// GET /api/projects/:id/summary  - financial summary
router.get('/:id/summary', requireAuth, async (req, res) => {
    const pid = req.params.id;
    const db = await getDb();

    const projRows = db.exec(`SELECT * FROM project WHERE project_id=?`, [pid]);
    const project = rowsToObjects(projRows)[0];
    if (!project) return res.status(404).json({ error: 'פרויקט לא נמצא' });

    // Labor cost = hours worked * hourly rate
    const laborRows = db.exec(`
    SELECT COALESCE(SUM((
      CAST(substr(wh.end_time,1,2) AS REAL)*60 + CAST(substr(wh.end_time,4,2) AS REAL)
      - CAST(substr(wh.start_time,1,2) AS REAL)*60 - CAST(substr(wh.start_time,4,2) AS REAL)
    )/60.0 * el.hourly_rate), 0) as labor_cost
    FROM work_hours wh
    JOIN employee e ON wh.phone = e.phone
    LEFT JOIN employee_level el ON e.level_id = el.level_id
    WHERE wh.project_id = ?`, [pid]);

    const expRows = db.exec(`
    SELECT COALESCE(SUM(amount),0) as expense_total
    FROM expenses WHERE project_id = ?`, [pid]);

    const labor_cost = laborRows[0]?.values[0][0] || 0;
    const expense_total = expRows[0]?.values[0][0] || 0;
    const actual_cost = labor_cost + expense_total;

    res.json({ ...project, labor_cost, expense_total, actual_cost });
});

module.exports = router;
