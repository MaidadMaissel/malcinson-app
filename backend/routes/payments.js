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

// POST /api/payments - pay employee a fixed amount
router.post('/', requireAuth, requireManager, async (req, res) => {
    const { phone, amount, note } = req.body;
    if (!phone || !amount) return res.status(400).json({ error: 'טלפון וסכום נדרשים' });
    const db = await getDb();
    db.run(`INSERT INTO salary_payments (phone, amount, note) VALUES (?,?,?)`,
        [phone, parseFloat(amount), note || null]);
    saveDb();
    res.json({ success: true });
});

// GET /api/payments?phone= - get payment history
router.get('/', requireAuth, async (req, res) => {
    const { phone } = req.query;
    const db = await getDb();
    let sql = `
    SELECT sp.*, e.name as employee_name
    FROM salary_payments sp
    JOIN employee e ON sp.phone = e.phone
    WHERE 1=1`;
    const params = [];
    if (phone) { sql += ` AND sp.phone=?`; params.push(phone); }
    sql += ` ORDER BY sp.paid_at DESC`;
    const rows = db.exec(sql, params);
    res.json(rowsToObjects(rows));
});

// GET /api/payments/owed/:phone - calculate total owed to one employee
router.get('/owed/:phone', requireAuth, async (req, res) => {
    const { phone } = req.params;
    const db = await getDb();

    const hoursRows = db.exec(`
    SELECT COALESCE(SUM((
      CAST(substr(wh.end_time,1,2) AS REAL)*60 + CAST(substr(wh.end_time,4,2) AS REAL)
      - CAST(substr(wh.start_time,1,2) AS REAL)*60 - CAST(substr(wh.start_time,4,2) AS REAL)
    )/60.0 * COALESCE(el.hourly_rate,0)), 0) as unpaid_labor
    FROM work_hours wh
    JOIN employee e ON wh.phone = e.phone
    LEFT JOIN employee_level el ON e.level_id = el.level_id
    WHERE wh.phone=? AND wh.payment_status IS NULL`, [phone]);

    const expRows = db.exec(`
    SELECT COALESCE(SUM(amount),0) as unpaid_expenses
    FROM expenses WHERE phone=? AND payment_status IS NULL`, [phone]);

    const paidRows = db.exec(`
    SELECT COALESCE(SUM(amount),0) as total_paid FROM salary_payments WHERE phone=?`, [phone]);

    const unpaid_labor = hoursRows[0]?.values[0][0] || 0;
    const unpaid_expenses = expRows[0]?.values[0][0] || 0;
    const total_paid = paidRows[0]?.values[0][0] || 0;
    const total_owed = unpaid_labor + unpaid_expenses;

    res.json({ phone, unpaid_labor, unpaid_expenses, total_owed, total_paid });
});

// GET /api/payments/owed-all - owed for all employees (manager dashboard)
router.get('/owed-all', requireAuth, requireManager, async (req, res) => {
    const db = await getDb();
    const empRows = db.exec(`SELECT phone, name FROM employee ORDER BY name`);
    const employees = rowsToObjects(empRows);

    const results = employees.map(emp => {
        const hRows = db.exec(`
      SELECT COALESCE(SUM((
        CAST(substr(wh.end_time,1,2) AS REAL)*60 + CAST(substr(wh.end_time,4,2) AS REAL)
        - CAST(substr(wh.start_time,1,2) AS REAL)*60 - CAST(substr(wh.start_time,4,2) AS REAL)
      )/60.0 * COALESCE(el.hourly_rate,0)), 0) as unpaid_labor
      FROM work_hours wh
      JOIN employee e ON wh.phone=e.phone
      LEFT JOIN employee_level el ON e.level_id=el.level_id
      WHERE wh.phone=? AND wh.payment_status IS NULL`, [emp.phone]);

        const eRows = db.exec(`
      SELECT COALESCE(SUM(amount),0) as unpaid_expenses
      FROM expenses WHERE phone=? AND payment_status IS NULL`, [emp.phone]);

        const unpaid_labor = hRows[0]?.values[0][0] || 0;
        const unpaid_expenses = eRows[0]?.values[0][0] || 0;
        return { ...emp, unpaid_labor, unpaid_expenses, total_owed: unpaid_labor + unpaid_expenses };
    });

    res.json(results);
});

module.exports = router;
