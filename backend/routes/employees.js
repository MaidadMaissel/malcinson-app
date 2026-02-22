const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database');
const { requireAuth, requireManager } = require('../middleware/auth');

// GET /api/employees - list all employees
router.get('/', requireAuth, async (req, res) => {
    const db = await getDb();
    const rows = db.exec(`
    SELECT e.phone, e.name, e.is_manager, el.level_id, el.level_name, el.hourly_rate
    FROM employee e
    LEFT JOIN employee_level el ON e.level_id = el.level_id
    ORDER BY e.name
  `);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    const data = rows[0].values.map(row => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = row[i]);
        return obj;
    });
    res.json(data);
});

// POST /api/employees - add employee (manager)
router.post('/', requireAuth, requireManager, async (req, res) => {
    const { phone, name, level_id, is_manager } = req.body;
    if (!phone || !name) return res.status(400).json({ error: 'שם וטלפון נדרשים' });
    const db = await getDb();
    try {
        db.run(`INSERT INTO employee (phone, name, level_id, is_manager) VALUES (?,?,?,?)`,
            [phone, name, level_id || null, is_manager ? 1 : 0]);
        saveDb();
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: 'עובד עם מספר זה כבר קיים' });
    }
});

// PUT /api/employees/:phone - edit employee (manager)
router.put('/:phone', requireAuth, requireManager, async (req, res) => {
    const { name, level_id, is_manager } = req.body;
    const db = await getDb();
    db.run(`UPDATE employee SET name=?, level_id=?, is_manager=? WHERE phone=?`,
        [name, level_id || null, is_manager ? 1 : 0, req.params.phone]);
    saveDb();
    res.json({ success: true });
});

// DELETE /api/employees/:phone
router.delete('/:phone', requireAuth, requireManager, async (req, res) => {
    const db = await getDb();
    db.run(`DELETE FROM employee WHERE phone=?`, [req.params.phone]);
    saveDb();
    res.json({ success: true });
});

// GET /api/employees/levels
router.get('/levels', requireAuth, async (req, res) => {
    const db = await getDb();
    const rows = db.exec(`SELECT * FROM employee_level ORDER BY level_name`);
    if (!rows.length) return res.json([]);
    const cols = rows[0].columns;
    const data = rows[0].values.map(row => {
        const obj = {}; cols.forEach((c, i) => obj[c] = row[i]); return obj;
    });
    res.json(data);
});

// POST /api/employees/levels
router.post('/levels', requireAuth, requireManager, async (req, res) => {
    const { level_name, hourly_rate } = req.body;
    const db = await getDb();
    db.run(`INSERT INTO employee_level (level_name, hourly_rate) VALUES (?,?)`, [level_name, hourly_rate]);
    saveDb();
    const rows = db.exec(`SELECT * FROM employee_level ORDER BY level_id DESC LIMIT 1`);
    const cols = rows[0].columns;
    const obj = {}; cols.forEach((c, i) => obj[c] = rows[0].values[0][i]);
    res.json(obj);
});

// PUT /api/employees/levels/:id
router.put('/levels/:id', requireAuth, requireManager, async (req, res) => {
    const { level_name, hourly_rate } = req.body;
    const db = await getDb();
    db.run(`UPDATE employee_level SET level_name=?, hourly_rate=? WHERE level_id=?`,
        [level_name, hourly_rate, req.params.id]);
    saveDb();
    res.json({ success: true });
});

module.exports = router;
