const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'שם וטלפון נדרשים' });

    const db = await getDb();
    const rows = db.exec(
        `SELECT e.phone, e.name, e.is_manager, el.level_name, el.hourly_rate
     FROM employee e
     LEFT JOIN employee_level el ON e.level_id = el.level_id
     WHERE e.phone = ? AND e.name = ?`,
        [phone, name]
    );

    if (!rows.length || !rows[0].values.length) {
        return res.status(401).json({ error: 'שם או טלפון שגויים' });
    }

    const [emp_phone, emp_name, is_manager, level_name, hourly_rate] = rows[0].values[0];
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { phone: emp_phone, name: emp_name, is_manager: !!is_manager },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
    );

    res.json({ token, employee: { phone: emp_phone, name: emp_name, is_manager: !!is_manager, level_name, hourly_rate } });
});

module.exports = router;
