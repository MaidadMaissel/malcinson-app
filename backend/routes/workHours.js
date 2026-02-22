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

// GET /api/work-hours?phone=&status=&project_id=
router.get('/', requireAuth, async (req, res) => {
    const { phone, status, project_id } = req.query;
    const db = await getDb();
    let sql = `
    SELECT wh.*, e.name as employee_name, el.hourly_rate, p.project_name,
      ROUND((
        CAST(substr(wh.end_time,1,2) AS REAL)*60 + CAST(substr(wh.end_time,4,2) AS REAL)
        - CAST(substr(wh.start_time,1,2) AS REAL)*60 - CAST(substr(wh.start_time,4,2) AS REAL)
      )/60.0, 2) as hours_worked,
      ROUND((
        CAST(substr(wh.end_time,1,2) AS REAL)*60 + CAST(substr(wh.end_time,4,2) AS REAL)
        - CAST(substr(wh.start_time,1,2) AS REAL)*60 - CAST(substr(wh.start_time,4,2) AS REAL)
      )/60.0 * COALESCE(el.hourly_rate,0), 2) as row_cost
    FROM work_hours wh
    JOIN employee e ON wh.phone = e.phone
    LEFT JOIN employee_level el ON e.level_id = el.level_id
    LEFT JOIN project p ON wh.project_id = p.project_id
    WHERE 1=1`;
    const params = [];
    if (phone) { sql += ` AND wh.phone=?`; params.push(phone); }
    if (status === 'unpaid') { sql += ` AND wh.payment_status IS NULL`; }
    if (status === 'paid') { sql += ` AND wh.payment_status IS NOT NULL`; }
    if (project_id) { sql += ` AND wh.project_id=?`; params.push(project_id); }
    sql += ` ORDER BY wh.work_date DESC, wh.start_time DESC`;
    const rows = db.exec(sql, params);
    res.json(rowsToObjects(rows));
});

// POST /api/work-hours - log work hours
router.post('/', requireAuth, async (req, res) => {
    const { phone, project_id, work_date, start_time, end_time } = req.body;
    const workerPhone = phone || req.user.phone;

    if (!work_date || !start_time || !end_time)
        return res.status(400).json({ error: 'תאריך ושעות נדרשים' });

    if (start_time >= end_time)
        return res.status(400).json({ error: 'שעת סיום חייבת להיות אחרי שעת התחלה' });

    const db = await getDb();

    // Check for overlapping hours on same day
    const overlap = db.exec(`
    SELECT id FROM work_hours
    WHERE phone=? AND work_date=?
    AND NOT (end_time <= ? OR start_time >= ?)`,
        [workerPhone, work_date, start_time, end_time]);

    if (overlap.length && overlap[0].values.length) {
        return res.status(409).json({ error: 'קיים חפיפה עם שעות עבודה קיימות באותו יום' });
    }

    db.run(`INSERT INTO work_hours (phone, project_id, work_date, start_time, end_time)
    VALUES (?,?,?,?,?)`,
        [workerPhone, project_id || null, work_date, start_time, end_time]);
    saveDb();
    res.json({ success: true });
});

// PUT /api/work-hours/:id/pay - mark as paid (manager)
router.put('/:id/pay', requireAuth, requireManager, async (req, res) => {
    const db = await getDb();
    db.run(`UPDATE work_hours SET payment_status='paid' WHERE id=?`, [req.params.id]);
    saveDb();
    res.json({ success: true });
});

// PUT /api/work-hours/pay-all/:phone - pay all unpaid for employee
router.put('/pay-all/:phone', requireAuth, requireManager, async (req, res) => {
    const db = await getDb();
    db.run(`UPDATE work_hours SET payment_status='paid' WHERE phone=? AND payment_status IS NULL`,
        [req.params.phone]);
    saveDb();
    res.json({ success: true });
});

// DELETE /api/work-hours/:id
router.delete('/:id', requireAuth, async (req, res) => {
    const db = await getDb();
    db.run(`DELETE FROM work_hours WHERE id=?`, [req.params.id]);
    saveDb();
    res.json({ success: true });
});

module.exports = router;
